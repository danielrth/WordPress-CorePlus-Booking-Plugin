jQuery( function ( $ )
{
	'use strict';

	$(document).ready( function() {

		const timezoneId = "39d62534-501c-49cd-9da9-6fa8d6a81f48";//fixed for Melbourne
		var locationsInfo = {};

		$("input.DatePicker").datepicker();
		$("input.BirthdayPicker").datepicker (
		{
			buttonImageOnly: true,
			yearRange: '1910:2010',
			changeYear: true
		});
		$("input.TimePicker").timepicker({ 'scrollDefault': 'now' });

		$('#h-show-alert').hide();

		sendRequestToAction('location', 'GET');
		sendRequestToAction('client', 'GET');
		sendRequestToAction('practitioner', 'GET');

		//register new client info
		$('#btn-submit-client').click(function() {
			//validate input data
			var isValid = true;
			
            $('#input-client-firstname,#input-client-lastname,#input-client-birthday,#input-client-phonenumber,#input-client-email').each(function () {
                if ($.trim($(this).val()) == '' || 
                	($(this).attr('id')=='input-client-phonenumber' && (isNaN($(this).val()) || $(this).val().length < 6)) || 
                	($(this).attr('id')=='input-client-email' && !isValidEmailAddress($(this).val()))
                ) {
                    isValid = false;
                    warnInvalidInput ($(this), false);
                }
                else {
                    warnInvalidInput ($(this), true);
                }
            });

            if (isValid == false)
            	return;
            
			//submit info to server API
			var postData = {
			 	"firstName": $('#input-client-firstname').val(), 
			 	"lastName": $('#input-client-lastname').val(), 
			 	"birthday": $('#input-client-birthday').val(),
			 	"phoneNumber": $('#input-client-phonenumber').val(),
			 	"eMail": $('#input-client-email').val()};
			sendRequestToAction('client', 'POST', postData);
		});

		//check availability slots of doctor
		$('#btn-check-availability').click(function() {
			var isValid = true;
			$('#select-doctor,#input-date').each(function () {
                if ($.trim($(this).val()) == '' || 
                	($(this).attr('id')=='select-doctor' && $(this).prop('selectedIndex') == 0))
                {
                    isValid = false;
                    warnInvalidInput ($(this), false);
                }
                else {
                    warnInvalidInput ($(this), true);
                }
            });
			if (isValid == false)
            	return;

            var checkDate = new Date ($('#input-date').val());
            var strCheckDate = checkDate.getFullYear() + '-' + 
            			formatTimeNumber(checkDate.getMonth() + 1) + '-' + 
            			formatTimeNumber(checkDate.getDate());

            var postData = "startDate=" + strCheckDate + "&endDate=" + strCheckDate + "&practitionerId=" + $('#select-doctor').val() + "&timezoneId=" + timezoneId;
			sendRequestToAction('availabilityslot', 'GET', postData);
			sendRequestToAction('appointment', 'GET', postData);
		});

		//submit booking appointment
		$('#btn-submit-booking').click(function() {

	      	cnvTimeline.fillStyle = "red";
			cnvTimeline.strokeStyle = "green";
			cnvTimeline.lineWidth = "1";
			cnvTimeline.fillRect(200, 10, 200, 50);
			cnvTimeline.strokeRect(0, 10, 400, 50);

			return;
			//validate input data

			var isValid = true;
			$('#select-registered-client,#select-doctor,#select-location,#input-date,#input-start-time,#input-end-time')
			.each(function () {
                if ($.trim($(this).val()) == '' || 
                	($(this).attr('id')=='select-registered-client' && $(this).prop('selectedIndex') == 0) || 
                	($(this).attr('id')=='select-doctor' && $(this).prop('selectedIndex') == 0) || 
                	($(this).attr('id')=='select-location' && $(this).prop('selectedIndex') == 0)
                ) {
                    isValid = false;
                    warnInvalidInput ($(this), false);
                }
                else {
                    warnInvalidInput ($(this), true);
                }
            });

			var startDate = new Date ($('#input-date').val());
			var startTimeDiff = getTimeDiffFromPicker($('#input-start-time').val());
			var endTimeDiff = getTimeDiffFromPicker($('#input-end-time').val());

			var startTime = new Date (startDate.getTime() + getTimeDiffFromPicker($('#input-start-time').val()));
			var endTime = new Date (startDate.getTime() + getTimeDiffFromPicker($('#input-end-time').val()));

			if (startTimeDiff == endTimeDiff) {
				isValid = false;
                warnInvalidInput ($('#input-end-time'), false);
			}
			else if (startTimeDiff > endTimeDiff) {
				endTime = new Date(endTime.getTime() + 24 * 3600 * 1000);
				warnInvalidInput ($('#input-end-time'), true);
			}
			else {
				warnInvalidInput ($('#input-end-time'), true);
			}

			if (isValid == false)
            	return;

            startTime = new Date(startTime.getTime() + 3600000 * 10);
            endTime = new Date(endTime.getTime() + 3600000 * 10);

			var strStartTime = startTime.toISOString().slice(0, 19) + "+10:00";
			var strEndTime = endTime.toISOString().slice(0, 19) + "+10:00";

			var clientsArr = new Array();
			clientsArr.push({"clientId": $('#select-registered-client').val()});
			var doctorsArr = {"practitionerId": $('#select-doctor').val()}

			var postData = {
			 	"startDateTime": strStartTime, 
			 	"endDateTime": strEndTime, 
			 	"practitioner": doctorsArr,
			 	"locationId": $('#select-location').val(),
			 	"clients": clientsArr};
			// console.log (postData);
			sendRequestToAction('appointment', 'POST', postData);
		});

		$('#select-registered-client').on('change', function (e) {
		    if ($('#select-registered-client').prop('selectedIndex') == 0) {
		    	$('#div-register-form').show();
		    }
		    else {
		    	$('#div-register-form').hide();
		    }
		});

		function sendRequestToAction(api_name, request_type, post_data = "") {

			if (request_type == "POST") {
				$('#h-show-alert').html('Waiting response. Please wait a minute...');
				$('#h-show-alert').show();
			}
			else {
				$('#h-show-alert').hide();
			}

			jQuery.post(
			    // '/wp-admin/admin-ajax.php',
			    '/mywp/wp-admin/admin-ajax.php',
			    {
			        'action': 'action_coreplus_api',
			        'api_name':   api_name,
			        'type': request_type,
			        'data': post_data
			    }, 
			    function(response){
			    	response = response.slice(0, -1);
			    	try {

			    		var resp_data = jQuery.parseJSON(response);
				        switch(api_name) {
				        	case "location":
				        		locationsInfo = resp_data.locations;
				        		break;
				        	case "client":
				        		if (request_type == "GET") {
				        			var clients = resp_data.clients;
				        			$.each(clients, function(key, value) {
								     $('#select-registered-client')
								         .append($("<option></option>")
								            .attr("value",value['clientId'])
								            .text(value['firstName'] + " " + value['lastName']));
									});
				        		}
				        		else {
				        			var newClient = resp_data.client;
				        			$('#select-registered-client')
								         .append($("<option></option>")
								            .attr("value",newClient['clientId'])
								            .text($('#input-client-firstname').val() + " " + $('#input-client-lastname').val()));
								    $("#select-registered-client option:last").attr("selected","selected");
								    $('#div-register-form').hide();
								    $('#h-show-alert').html('You are successfully registered.');
				        		}
				        		
				        		break;
				        	case "practitioner":
				        		var doctors = resp_data.practitioners;
				        		$.each(doctors, function(key, value) {   
								     $('#select-doctor')
								         .append($("<option></option>")
								            .attr("value",value['practitionerId'])
								            .text(value['firstName'] + " " + value['lastName'])); 
								});
				        		break;
				        	case "appointment":
				        		if (request_type == "POST") {
				        			if ('appointment' in resp_data) {
					        			var newApp = resp_data.appointment;
						        		if ('appointmentId' in newApp) {
						        			$('#h-show-alert').html('Successfully booked an appointment.');
						        		}
					        		}
					        		else if ('result' in resp_data){
					        			var resultRes = resp_data.result[0];
					        			$('#h-show-alert').html(resultRes['reason']);
					        		}
					        		else {
					        			$('#h-show-alert').html('Failed. Try again later.');
					        		}
				        		}
				        		else {
				        			var appointments = resp_data.appointments;
					        		var strAPHtml = "";
					        		$.each(appointments, function(key, value) {
								     	strAPHtml += "<p>" + value['startDateTime'].substr(11,5) + " ~ "  + value['endDateTime'].substr(11,5) + "</p>";
									});
					        		$('#div-appointments').html(strAPHtml);
				        		}
				        		
				        		break;
				        	case "availabilityslot":
				        		var timeSlots = resp_data.timeslots;
				        		var strAVHtml = "";
				        		var availableLoc = "";
				        		$.each(timeSlots, function(key, value) {
							     	strAVHtml += "<p>" + value['startDateTime'].substr(11,5) + " ~ "  + value['endDateTime'].substr(11,5) + "</p>";
								});
				        		$('#div-schedule').html(strAVHtml);

								if (timeSlots.length > 0) {
									var loc = "";
									for (var key in locationsInfo) {
										if (locationsInfo[key]['locationId'] == timeSlots[0]['locationId']){
											loc = locationsInfo[key]['name']
										}
									}
									$('#div-available-location').html(loc);	
								}
							    
				        		console.log(locationsInfo);
				        		break;
				        	default:
				        		break;
				        }
			    	}
			        catch(e) {
			        	// alert(e);
			        	$('#h-show-alert').html('Failed. Try again later.');
			        }
			    }
			);
		}
	});

	function formatTimeNumber (ttt) {
		return ttt < 10 ? "0" + ttt : "" + ttt;
	}

	function convertOffsetToTimeZone(offsetValue) {
		var strTimezone = offsetValue <= 0 ? "+" : "-";

		offsetValue = Math.abs(offsetValue);
		var offsetHours = offsetValue / 60;

		strTimezone += Math.floor(offsetHours) >= 10 ? Math.floor(offsetHours).toString() : "0" + Math.floor(offsetHours).toString();

		strTimezone += ":";
		var offsetMinutes = offsetValue - offsetHours * 60;
		strTimezone += offsetMinutes >= 10 ? offsetMinutes.toString() : "0" + offsetMinutes.toString();
		return strTimezone;
	}

	function getTimeDiffFromPicker(strTime) {
		if (strTime.indexOf('am') !== -1) {
			var numTime = strTime.replace('am' , '').split(':');
			var numHour = parseInt(numTime[0]);
			if (numHour >= 12) numHour = numHour - 12;
			return numHour * 3600 * 1000 + parseInt(numTime[1]) * 60 * 1000;
		}
		if (strTime.indexOf('pm') !== -1) {
			var numTime = strTime.replace('pm' , '').split(':');
			return (12 + parseInt(numTime[0])) * 3600 * 1000 + parseInt(numTime[1]) * 60 * 1000;
		}
		return 0;
	}

	function isValidEmailAddress(emailAddress) {
	    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
	    return pattern.test(emailAddress);
	};

	function warnInvalidInput(elementObj, valid) {
		if(valid == false) {
			elementObj.css({
                "border": "1px solid red",
                "background": "#FFCECE"
            });
		}
		else {
			elementObj.css({
                "border": "",
                "background": ""
            });
		}
	}

});
