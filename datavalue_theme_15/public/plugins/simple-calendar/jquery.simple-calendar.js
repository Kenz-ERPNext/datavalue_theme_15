// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    let pluginName = "simpleCalendar",
        defaults = {
            months: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'], //string of months starting from january
            days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], //string of days starting from sunday
            displayYear: true, // display year in header
            fixedStartDay: true, // Week begin always by monday or by day set by number 0 = sunday, 7 = saturday, false = month always begin by first day of the month
            displayEvent: true, // display existing event
            disableEventDetails: false, // disable showing event details
            disableEmptyDetails: false, // disable showing empty date details
            events: [], // List of event
            onInit: function (calendar) {
            }, // Callback after first initialization
            onMonthChange: function (month, year) {
            }, // Callback on month change
            onDateSelect: function (date, events) {
            }, // Callback on date selection
            onEventSelect: function () {
            },              // Callback fired when an event is selected     - see $(this).data('event')
            onEventCreate: function ($el) {
            },          // Callback fired when an HTML event is created - see $(this).data('event')
            onDayCreate: function ($el, d, m, y) {
            }  // Callback fired when an HTML day is created   - see $(this).data('today'), .data('todayEvents')
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.currentDate = new Date();
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            let container = $(this.element);
            let todayDate = this.currentDate;

            let calendar = $('<div class="calendar"></div>');
            let header = $('<header>' +
                '<h2 class="month"></h2>' +
                '<button type="button" class="simple-calendar-btn btn-prev cursor-pointer"></button>' +
                '<button type="button" class="simple-calendar-btn btn-next cursor-pointer"></button>' +
                '</header>');

            this.updateHeader(todayDate, header);
            calendar.append(header);

            this.buildCalendar(todayDate, calendar);
            container.append(calendar);

            this.bindEvents();
            this.settings.onInit(this);
        },

        //Update the current month header
        updateHeader: function (date, header) {
            let monthText = this.settings.months[date.getMonth()];
            monthText += this.settings.displayYear ? ' <div class="year">' + date.getFullYear() : '</div>';
            header.find('.month').html(monthText);
        },

        //Build calendar of a month from date
        buildCalendar: function (fromDate, calendar) {
            let plugin = this;

            calendar.find('table').remove();

            let body = $('<table></table>');
            let thead = $('<thead></thead>');
            let tbody = $('<tbody></tbody>');

            //setting current year and month
            let y = fromDate.getFullYear(), m = fromDate.getMonth();

            //first day of the month
            let firstDay = new Date(y, m, 1);
            //last day of the month
            let lastDay = new Date(y, m + 1, 0);
            // Start day of weeks
            let startDayOfWeek = firstDay.getDay();

            if (this.settings.fixedStartDay !== false) {
                // Backward compatibility
                startDayOfWeek = this.settings.fixedStartDay === true ? 1 : this.settings.fixedStartDay;

                // If first day of month is different of startDayOfWeek
                while (firstDay.getDay() !== startDayOfWeek) {
                    firstDay.setDate(firstDay.getDate() - 1);
                }
                // If last day of month is different of startDayOfWeek + 7
                while (lastDay.getDay() !== ((startDayOfWeek + 6) % 7)) {
                    lastDay.setDate(lastDay.getDate() + 1);
                }
            }

            //Header day in a week ( (x to x + 7) % 7 to start the week by monday if x = 1)
            for (let i = startDayOfWeek; i < startDayOfWeek + 7; i++) {
                // thead.append($('<td>' + this.settings.days[i % 7].substring(0, 3) + '</td>'));
                thead.append($('<th>' + this.settings.days[i % 7] + '</th>'));
            }

            //For firstDay to lastDay
            for (let day = firstDay; day <= lastDay; day.setDate(day.getDate())) {
                let tr = $('<tr></tr>');
                //For each row
                for (let i = 0; i < 7; i++) {
                    let td = $('<td><div class="day" data-date="' + day.toISOString() + '">' + day.getDate() + '</div></td>');

                    let $day = td.find('.day');

                    //if today is this day
                    if (day.toDateString() === (new Date).toDateString()) {
                        $day.addClass("today");
                    }

                    //if day is not in this month
                    if (day.getMonth() != fromDate.getMonth()) {
                        $day.addClass("wrong-month");
                    }

                    // filter today's events
                    let todayEvents = plugin.getDateEvents(day);

                    if (todayEvents.length && plugin.settings.displayEvent) {
                        $day.addClass(plugin.settings.disableEventDetails ? "has-event disabled" : "has-event");
                    } else {
                        $day.addClass(plugin.settings.disableEmptyDetails ? "disabled" : "");
                    }

                    // associate some data available from the onDayCreate callback
                    $day.data('todayEvents', todayEvents);

                    // simplify further customization
                    this.settings.onDayCreate($day, day.getDate(), m, y);

                    tr.append(td);
                    day.setDate(day.getDate() + 1);
                }
                tbody.append(tr);
            }

            body.append(thead);
            body.append(tbody);

            let eventContainer = $('<div class="event-container"><div class="close"></div><div class="event-wrapper"></div></div>');

            calendar.append(body);
            calendar.append(eventContainer);
        },
        changeMonth: function (value) {
            this.currentDate.setMonth(this.currentDate.getMonth() + value, 1);
            this.buildCalendar(this.currentDate, $(this.element).find('.calendar'));
            this.updateHeader(this.currentDate, $(this.element).find('.calendar header'));
            this.settings.onMonthChange(this.currentDate.getMonth(), this.currentDate.getFullYear())
        },
        //Init global events listeners
        bindEvents: function () {
            let plugin = this;

            //Remove previously created events
            $(plugin.element).off();

            //Click previous month
            $(plugin.element).on('click', '.btn-prev', function (e) {
                e.preventDefault();
                plugin.changeMonth(-1)
            });

            //Click next month
            $(plugin.element).on('click', '.btn-next', function (e) {
                e.preventDefault();
                plugin.changeMonth(1);
            });

            //Binding day event
            $(plugin.element).on('click', '.day', function (e) {
                e.preventDefault();
                let date = new Date($(this).data('date'));
                let events = plugin.getDateEvents(date);
                if (!$(this).hasClass('disabled')) {
                    plugin.fillUp(e.pageX, e.pageY);
                    plugin.displayEvents(events);
                }
                plugin.settings.onDateSelect(date, events);
            });

            //Binding event container close
            $(plugin.element).on('click', '.event-container .close', function (e) {
                plugin.empty(e.pageX, e.pageY);
            });
        },
        displayEvents: function (events) {
            let plugin = this;
            let container = $(this.element).find('.event-wrapper');
            events.forEach(function (event) {
                let startDate = new Date(event.startDate);
                let endDate = new Date(event.endDate);
                let color = (event.color && event.color.length) ? 'style="background-color:' + event.color + '"' : '';
                let time = startDate.getHours() + ':' + (startDate.getMinutes() < 10 ? '0' : '') + startDate.getMinutes();
                if (event.all_day == 1)
                    time = __('All Day');
                console.log('event.all_day', event.all_day)
                let $event = $('' +
                    '<div class="event" ' + color + '>' +
                    ' <div class="event-hour">' + time + '</div>' +
                    ' <div class="event-date">' + plugin.formatDateEvent(startDate, endDate) + '</div>' +
                    ' <div class="event-summary">' + event.summary + '</div>' +
                    '</div>');

                $event.data('event', event);
                $event.click(plugin.settings.onEventSelect);

                // simplify further customization
                plugin.settings.onEventCreate($event);

                container.append($event);
            })
        },
        addEvent: function (newEvent) {
            let plugin = this;
            // add the new event to events list
            plugin.settings.events = [...plugin.settings.events, newEvent]
            this.buildCalendar(this.currentDate, $(this.element).find('.calendar'));
        },
        setEvents: function (newEvents) {
            let plugin = this;
            // add the new event to events list
            plugin.settings.events = newEvents
            this.buildCalendar(this.currentDate, $(this.element).find('.calendar'));
        },
        //Small effect to fillup a container
        fillUp: function (x, y) {
            let plugin = this;
            let elem = $(plugin.element);
            let elemOffset = elem.offset();

            let filler = $('<div class="filler" style=""></div>');
            filler.css("left", x - elemOffset.left);
            filler.css("top", y - elemOffset.top);

            elem.find('.calendar').append(filler);

            filler.animate({
                width: "300%",
                height: "300%"
            }, 500, function () {
                elem.find('.event-container').show();
                filler.hide();
            });
        },
        //Small effect to empty a container
        empty: function (x, y) {
            let plugin = this;
            let elem = $(plugin.element);
            let elemOffset = elem.offset();

            let filler = elem.find('.filler');
            filler.css("width", "300%");
            filler.css("height", "300%");

            filler.show();

            elem.find('.event-container').hide().find('.event').remove();

            filler.animate({
                width: "0%",
                height: "0%"
            }, 500, function () {
                filler.remove();
            });
        },
        getDateEvents: function (d) {
            let plugin = this;
            return plugin.settings.events.filter(function (event) {
                return plugin.isDayBetween(new Date(d), new Date(event.startDate), new Date(event.endDate));
            });
        },
        isDayBetween: function (d, dStart, dEnd) {
            dStart.setHours(0, 0, 0);
            dEnd.setHours(23, 59, 59, 999);
            d.setHours(12, 0, 0);

            return dStart <= d && d <= dEnd;
        },
        formatDateEvent: function (dateStart, dateEnd) {
            let formatted = '';
            formatted += this.settings.days[dateStart.getDay()] + ' - ' + dateStart.getDate() + ' ' + this.settings.months[dateStart.getMonth()];

            if (dateEnd.getDate() !== dateStart.getDate()) {
                formatted += ' ' + __('to') + ' ' + dateEnd.getDate() + ' ' + this.settings.months[dateEnd.getMonth()]
            }
            return formatted;
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };
})(jQuery, window, document);
