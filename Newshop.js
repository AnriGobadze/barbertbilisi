// Newshop.js - Complete Final Code

document.addEventListener('DOMContentLoaded', () => {
    // Correctly initialize the Supabase client.
    const supaClient = supabase.createClient(
        'https://mjsmnsxqwxmpevckzych.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qc21uc3hxd3htcGV2Y2t6eWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzAwMzEsImV4cCI6MjA2NDcwNjAzMX0.6INQZFMGFWq4kiwzbcVLEL1m_7lgmwWXF1pc_4K3Ncw'
    );

    const AppConfig = {
        apiBaseUrl: '/api',
        // UPDATED: Global booking settings
        booking: {
            maxAdvanceBookingDays: 20,
            restTimeMinutes: 6 // Barber's rest time set to 6 minutes
        },
        // NEW: This array will be filled with data from the HTML page itself.
        services: [], 
        timeSlots: {
            morning: ["11:00", "11:45"],
            day: ["12:30", "13:15", "14:00", "14:45", "15:30", "16:15", "17:00", "17:45"],
            evening: ["18:30", "19:15", "20:00"]
        },
        locale: {
            months: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
            daysShort: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"]
        },
        validationRegex: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phoneGE: /^\d{9}$/
        }
    };
    
    // NEW: Helper function to parse duration strings like "(~ 1.5 საათი)" into minutes
    function parseDuration(durationText) {
        if (!durationText) return 45; // Default duration if text is missing
        const match = durationText.match(/(\d+(\.\d+)?)\s*(საათი|წუთი)/);
        if (!match) return 45; // Default if parsing fails
        const value = parseFloat(match[1]);
        const unit = match[3];
        if (unit.includes("საათი")) {
            return value * 60; // Convert hours to minutes
        }
        return value; // Assume minutes
    }

    // NEW: Function to read services from the DOM and populate AppConfig
    function initializeServicesFromDOM() {
        const serviceCards = document.querySelectorAll('#services .service-card');
        serviceCards.forEach(card => {
            const nameElement = card.querySelector('h3');
            const durationElement = card.querySelector('small.service-duration');
            if (nameElement && durationElement) {
                const serviceName = nameElement.textContent.trim();
                const durationInMinutes = parseDuration(durationElement.textContent);
                AppConfig.services.push({
                    value: serviceName,
                    text: serviceName,
                    duration: durationInMinutes
                });
            }
        });
        console.log("Services loaded from HTML:", AppConfig.services);
    }
    
    // NEW: Run the function immediately on page load to populate the services
    initializeServicesFromDOM();

    // The ApiService now uses the dynamic AppConfig data
    const ApiService = {
        // Helper to convert "HH:MM" to minutes for calculations
        _timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        },

        // This simplified function just checks the valid booking window.
        async fetchAvailableDates(year, month) {
            const availableDates = {};
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date(); today.setHours(0,0,0,0);
            const maxBookingDate = new Date(today);
            maxBookingDate.setDate(today.getDate() + AppConfig.booking.maxAdvanceBookingDays);
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);
                if (currentDate >= today && currentDate <= maxBookingDate) {
                     availableDates[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = true;
                }
            }
            return availableDates;
        },
        
        // UPGRADED: The core logic to fetch available times based on duration and rest time.
        async fetchAvailableTimes(dateString) {
            console.log(`ApiService: Fetching available times for ${dateString} with DURATION logic`);

            const allPossibleSlots = [...AppConfig.timeSlots.morning, ...AppConfig.timeSlots.day, ...AppConfig.timeSlots.evening];
            const allPossibleSlotsInMinutes = allPossibleSlots.map(t => this._timeToMinutes(t));
            const serviceDurationMap = new Map(AppConfig.services.map(s => [s.value, s.duration]));

            try {
                const { data: bookings, error } = await supaClient
                    .from('bookings')
                    .select('time, service_name')
                    .eq('date', dateString);
                if (error) { throw error; }

                const busyIntervals = bookings.map(booking => {
                    const startTime = this._timeToMinutes(booking.time);
                    const duration = serviceDurationMap.get(booking.service_name) || 45; // Default to 45 min just in case
                    const endTime = startTime + duration + AppConfig.booking.restTimeMinutes;
                    return { start: startTime, end: endTime };
                });

                const availableSlotsInMinutes = allPossibleSlotsInMinutes.filter(slotTime => {
                    return !busyIntervals.some(interval => slotTime >= interval.start && slotTime < interval.end);
                });

                const availableSlots = availableSlotsInMinutes.map(minutes => {
                    const h = Math.floor(minutes / 60);
                    const m = minutes % 60;
                    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                });
                
                return {
                    morning: availableSlots.filter(t => AppConfig.timeSlots.morning.includes(t)),
                    day: availableSlots.filter(t => AppConfig.timeSlots.day.includes(t)),
                    evening: availableSlots.filter(t => AppConfig.timeSlots.evening.includes(t)),
                };
            } catch (err) {
                console.error("An unexpected error occurred while calculating available times:", err);
                return { morning: [], day: [], evening: [] };
            }
        },

        async submitContactForm(contactData) {
            console.log('ApiService: MOCK Submitting contact form', contactData);
            await new Promise(resolve => setTimeout(resolve, 700));
             if (contactData.email.includes("error")) {
                 return { success: false, message: 'შეტყობინების გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.' };
            }
            return { success: true, message: `შეტყობინება წარმატებით გაიგზავნა. მადლობა, ${contactData.name}!` };
        }
    };

    const UIUtils = {
        showElement: (el) => { if (el) el.style.display = 'block'; },
        hideElement: (el) => { if (el) el.style.display = 'none'; },
        showFlexElement: (el) => { if (el) el.style.display = 'flex'; },
        toggleClass: (el, className, force) => { if (el) el.classList.toggle(className, force); },
        addClass: (el, className) => { if (el) el.classList.add(className); },
        removeClass: (el, className) => { if (el) el.classList.remove(className); },
        setText: (el, text) => { if (el) el.textContent = text; },
        setHTML: (el, html) => { if (el) el.innerHTML = html; },
        getValue: (el) => el ? el.value : '',
        setValue: (el, value) => { if (el) el.value = value; },
        disableElement: (el, isDisabled = true) => { if (el) el.disabled = isDisabled; },
        enableElement: (el) => { if (el) el.disabled = false; },
        getDataset: (el, key) => el && el.dataset[key],
        focusElement: (el) => { if (el) el.focus(); }
    };

    const SpaNavigator = {
        elements: {},
        init() {
            this.elements = {
                pageSections: document.querySelectorAll('.page-section'),
                navMenuLinks: document.querySelectorAll('.navbar .nav-link'),
                spaLinks: document.querySelectorAll('.spa-link'),
                hamburger: document.querySelector('.hamburger'),
                navMenu: document.querySelector('.nav-menu'),
                navLogo: document.querySelector('.nav-logo'),
                navbar: document.querySelector('.navbar')
            };
            this._bindEvents();
            this._handleInitialLoad();
        },
        _bindEvents() {
            this.elements.spaLinks.forEach(link => {
                link.addEventListener('click', (event) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        event.preventDefault();
                        const targetId = href.substring(1);
                        this.switchActiveSection(targetId);
                        if (this.elements.hamburger?.classList.contains('active')) {
                            UIUtils.removeClass(this.elements.hamburger, 'active');
                            UIUtils.removeClass(this.elements.navMenu, 'active');
                        }
                    }
                });
            });
            if (this.elements.hamburger && this.elements.navMenu) {
                this.elements.hamburger.addEventListener('click', () => {
                    UIUtils.toggleClass(this.elements.hamburger, 'active');
                    UIUtils.toggleClass(this.elements.navMenu, 'active');
                });
            }
        },
        _handleInitialLoad() {
            const initialHash = window.location.hash;
            const targetId = (initialHash && initialHash !== "#" && document.getElementById(initialHash.substring(1)))
                ? initialHash.substring(1)
                : 'hero';
            this.switchActiveSection(targetId, false);
        },
        switchActiveSection(targetId, smoothScroll = true) {
            targetId = (!targetId || targetId === '#') ? 'hero' : targetId;
            let sectionFound = false;
            this.elements.pageSections.forEach(section => {
                const isActive = section.id === targetId;
                UIUtils.toggleClass(section, 'active-section', isActive);
                if (isActive) { sectionFound = true; }
            });
            if (!sectionFound && document.getElementById('hero')) {
                UIUtils.addClass(document.getElementById('hero'), 'active-section');
                targetId = 'hero';
            }
            this.elements.navMenuLinks.forEach(link => {
                UIUtils.toggleClass(link, 'active', link.getAttribute('href') === `#${targetId}`);
            });
            if (this.elements.navLogo) { UIUtils.toggleClass(this.elements.navLogo, 'active', targetId === 'hero'); }
            const navbarHeight = this.elements.navbar?.offsetHeight || 70;
            const targetSectionElement = document.getElementById(targetId);
            if (targetSectionElement) {
                let scrollToY = (targetId === 'hero') ? 0 : targetSectionElement.offsetTop - navbarHeight - 10;
                window.scrollTo({ top: Math.max(0, scrollToY), behavior: smoothScroll ? 'smooth' : 'auto' });
            }
            if (targetId === 'booking' && window.BookingFlow && typeof window.BookingFlow.resetToFirstStep === 'function') {
                 window.BookingFlow.resetToFirstStep();
            }
        }
    };

    const BookingFlow = {
        elements: {},
        state: {
            currentDisplayDate: new Date(),
            selectedFullDate: null,
            selectedTime: null,
            selectedService: { value: null, text: null },
            currentStep: 'date',
            availableServices: [],
            availableDatesCache: {},
            availableTimesCache: {}
        },
        init() {
            this._cacheDOMElements();
            if (!this.elements.bookingForm) { console.warn("BookingFlow: bookingForm not found. Booking flow may not work."); return; }
            this._bindEvents();
            this._setupInitialUI();
            this.loadServicesAndRenderCalendar();
        },
        _cacheDOMElements() {
            this.elements = {
                dateStep: document.getElementById('date-selection-step'),
                timeStep: document.getElementById('time-selection-step'),
                serviceStep: document.getElementById('service-selection-step'),
                detailsStep: document.getElementById('user-details-step'),
                backButton: document.getElementById('booking-back-button'),
                currentMonthYearDisplay: document.getElementById('current-month-year-display'),
                prevMonthBtn: document.getElementById('prev-month-btn'),
                nextMonthBtn: document.getElementById('next-month-btn'),
                calendarGrid: document.getElementById('calendar-grid-main'),
                calendarDaysHeader: document.getElementById('calendar-days-header'),
                selectedDateDisplayHeader: document.getElementById('selected-date-display-header'),
                morningSlotsContainer: document.getElementById('morning-slots'),
                daySlotsContainer: document.getElementById('day-slots'),
                eveningSlotsContainer: document.getElementById('evening-slots'),
                noTimeSlotsMessage: document.getElementById('no-time-slots-message'),
                serviceListContainer: document.getElementById('service-list-container'),
                bookingSummaryDisplay: document.getElementById('booking-summary-display'),
                selectedDateHidden: document.getElementById('selected-date-hidden'),
                selectedTimeHidden: document.getElementById('selected-time-hidden'),
                selectedServiceValueHidden: document.getElementById('selected-service-value-hidden'),
                selectedServiceTextHidden: document.getElementById('selected-service-text-hidden'),
                bookingForm: document.getElementById('booking-form'),
                bookingConfirmation: document.getElementById('booking-confirmation-message'),
                bookingFormWrapper: document.querySelector('.booking-form-wrapper'),
                nameInput: document.getElementById('name'),
                emailInput: document.getElementById('email'),
                phoneInput: document.getElementById('phone')
            };
        },
        _bindEvents() {
            if(this.elements.prevMonthBtn) { this.elements.prevMonthBtn.addEventListener('click', () => this._changeMonth(-1)); }
            if(this.elements.nextMonthBtn) { this.elements.nextMonthBtn.addEventListener('click', () => this._changeMonth(1)); }
            if(this.elements.backButton) { this.elements.backButton.addEventListener('click', () => this._handleBackClick()); }
            if(this.elements.bookingForm) { this.elements.bookingForm.addEventListener('submit', (e) => this._handleBookingSubmit(e)); }
        },
        _setupInitialUI() {
            if (this.elements.calendarDaysHeader) {
                UIUtils.setHTML(this.elements.calendarDaysHeader, AppConfig.locale.daysShort.map(day => `<span>${day}</span>`).join(''));
            }
             this._goToStep('date');
        },
        async loadServicesAndRenderCalendar() {
            if (this.elements.noTimeSlotsMessage) {
                UIUtils.showElement(this.elements.noTimeSlotsMessage);
                UIUtils.setText(this.elements.noTimeSlotsMessage, "იტვირთება...");
            }
            try {
                // ADJUSTED: Services are now available globally in AppConfig after being loaded from the DOM.
                this.state.availableServices = AppConfig.services;
                await this.renderCalendar();
            } catch (error) {
                console.error("Failed to load initial booking data:", error);
                if (this.elements.currentMonthYearDisplay) { UIUtils.setText(this.elements.currentMonthYearDisplay, "მონაცემების ჩატვირთვის შეცდომა."); }
                if (this.elements.noTimeSlotsMessage) { UIUtils.setText(this.elements.noTimeSlotsMessage, "მონაცემების ჩატვირთვის შეცდომა."); }
            } finally {
                if(this.state.currentStep === 'date' && this.elements.noTimeSlotsMessage) {
                     UIUtils.hideElement(this.elements.noTimeSlotsMessage);
                }
            }
        },
        _changeMonth(monthOffset) {
            this.state.currentDisplayDate.setMonth(this.state.currentDisplayDate.getMonth() + monthOffset);
            this.renderCalendar();
        },
        async renderCalendar() {
            const { calendarGrid, currentMonthYearDisplay, prevMonthBtn, nextMonthBtn } = this.elements;
            if (!calendarGrid || !currentMonthYearDisplay) { return; }
            UIUtils.setHTML(calendarGrid, '<div>იტვირთება კალენდარი...</div>');
            const month = this.state.currentDisplayDate.getMonth();
            const year = this.state.currentDisplayDate.getFullYear();
            UIUtils.setText(currentMonthYearDisplay, `${AppConfig.locale.months[month]} ${year}`);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const maxAdvanceDate = new Date(today); maxAdvanceDate.setDate(today.getDate() + AppConfig.booking.maxAdvanceBookingDays);
            if (prevMonthBtn) { UIUtils.disableElement(prevMonthBtn, new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)); }
            if (nextMonthBtn) { UIUtils.disableElement(nextMonthBtn, new Date(year, month, 1) >= new Date(maxAdvanceDate.getFullYear(), maxAdvanceDate.getMonth(), 1)); }
            const monthCacheKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            if (!this.state.availableDatesCache[monthCacheKey]) {
                try {
                    this.state.availableDatesCache[monthCacheKey] = await ApiService.fetchAvailableDates(year, month);
                } catch (error) {
                    console.error("Failed to fetch date availability:", error);
                    this.state.availableDatesCache[monthCacheKey] = {};
                    UIUtils.setHTML(calendarGrid, '<div>კალენდრის ჩატვირთვის შეცდომა.</div>');
                    return;
                }
            }
            const monthAvailability = this.state.availableDatesCache[monthCacheKey];
            UIUtils.setHTML(calendarGrid, '');
            const firstDayOfMonthDate = new Date(year, month, 1);
            let firstDayOfMonthWeekday = firstDayOfMonthDate.getDay();
            firstDayOfMonthWeekday = (firstDayOfMonthWeekday === 0) ? 6 : firstDayOfMonthWeekday - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 0; i < firstDayOfMonthWeekday; i++) {
                const emptyCell = document.createElement('div');
                UIUtils.addClass(emptyCell, 'calendar-day'); UIUtils.addClass(emptyCell, 'empty');
                calendarGrid.appendChild(emptyCell);
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                UIUtils.addClass(dayCell, 'calendar-day');
                UIUtils.setText(dayCell, day);
                dayCell.dataset.day = String(day);
                const currentDate = new Date(year, month, day); currentDate.setHours(0,0,0,0);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (!monthAvailability[dateStr]) {
                    UIUtils.addClass(dayCell, 'disabled');
                } else {
                    dayCell.addEventListener('click', () => { this._handleDayClick(dateStr, dayCell); });
                }
                if (currentDate.getTime() === today.getTime()) { UIUtils.addClass(dayCell, 'today'); }
                if (this.state.selectedFullDate === dateStr) { UIUtils.addClass(dayCell, 'selected'); }
                calendarGrid.appendChild(dayCell);
            }
        },
        _handleDayClick(dateString, clickedCell) {
            this.state.selectedFullDate = dateString;
            UIUtils.setValue(this.elements.selectedDateHidden, dateString);
            document.querySelectorAll('#calendar-grid-main .calendar-day.selected').forEach(cell => { UIUtils.removeClass(cell, 'selected'); });
            UIUtils.addClass(clickedCell, 'selected');
            if(this.elements.selectedDateDisplayHeader) { UIUtils.setText(this.elements.selectedDateDisplayHeader, `(${dateString})`); }
            this.renderTimeSlotsForDate(dateString);
            this._goToStep('time');
        },
        async renderTimeSlotsForDate(dateString) {
            const { morningSlotsContainer, daySlotsContainer, eveningSlotsContainer, noTimeSlotsMessage } = this.elements;
            if(!morningSlotsContainer || !daySlotsContainer || !eveningSlotsContainer || !noTimeSlotsMessage) { return; }
            [morningSlotsContainer, daySlotsContainer, eveningSlotsContainer].forEach(c => { UIUtils.setHTML(c, ''); });
            UIUtils.setText(noTimeSlotsMessage, "მოწმდება თავისუფალი დროები...");
            UIUtils.showElement(noTimeSlotsMessage);
            let availableTimes;
            if (this.state.availableTimesCache[dateString]) {
                availableTimes = this.state.availableTimesCache[dateString];
            } else {
                try {
                    availableTimes = await ApiService.fetchAvailableTimes(dateString);
                    this.state.availableTimesCache[dateString] = availableTimes;
                } catch (error) {
                    console.error(`Failed to fetch time slots for ${dateString}:`, error);
                    availableTimes = { morning: [], day: [], evening: [] };
                    UIUtils.setText(noTimeSlotsMessage, "დროების ჩატვირთვის შეცდომა.");
                }
            }
            let totalSlotsAvailable = 0;
            const populateCategory = (container, timesArray) => {
                if (timesArray && timesArray.length > 0) {
                    totalSlotsAvailable += timesArray.length;
                    timesArray.forEach(time => {
                        const slotBtn = document.createElement('button');
                        slotBtn.type = 'button';
                        UIUtils.addClass(slotBtn, 'time-slot-btn');
                        UIUtils.setText(slotBtn, time);
                        slotBtn.dataset.time = time;
                        if (this.state.selectedTime === time) { UIUtils.addClass(slotBtn, 'selected'); }
                        slotBtn.addEventListener('click', () => { this._handleTimeClick(time, slotBtn); });
                        container.appendChild(slotBtn);
                    });
                }
            };
            populateCategory(morningSlotsContainer, availableTimes.morning);
            populateCategory(daySlotsContainer, availableTimes.day);
            populateCategory(eveningSlotsContainer, availableTimes.evening);
            if (totalSlotsAvailable === 0) {
                 UIUtils.setText(noTimeSlotsMessage, "ამ თარიღზე თავისუფალი დრო არ არის.");
                 UIUtils.showElement(noTimeSlotsMessage);
            } else {
                 UIUtils.hideElement(noTimeSlotsMessage);
            }
        },
        _handleTimeClick(time, clickedBtn) {
            this.state.selectedTime = time;
            UIUtils.setValue(this.elements.selectedTimeHidden, time);
            document.querySelectorAll('.time-slot-btn.selected').forEach(btn => { UIUtils.removeClass(btn, 'selected'); });
            UIUtils.addClass(clickedBtn, 'selected');
            this._renderServiceList();
            this._goToStep('service');
        },
       


_renderServiceList() {
    const { serviceListContainer } = this.elements;
    if (!serviceListContainer) { return; }

    UIUtils.setHTML(serviceListContainer, '');

    this.state.availableServices.forEach(service => {
        const serviceBtn = document.createElement('button');
        serviceBtn.type = 'button';
        UIUtils.addClass(serviceBtn, 'service-option-btn');

        // --- UPDATED LOGIC ---

        // 1. Format the duration as before.
        let durationString = '';
        if (service.duration >= 60) {
            const hours = parseFloat((service.duration / 60).toFixed(1));
            durationString = `(~ ${hours} საათი)`;
        } else {
            durationString = `(~ ${service.duration} წუთი)`;
        }

        // 2. Build an HTML string with a special class for the duration.
        // This is the key change! We wrap the duration in a span with a class.
        const buttonHTML = `
            <span class="service-name-display">${service.text}</span>
            <span class="service-duration-display">${durationString}</span>
        `;
        
        // 3. Use setHTML to place this structure inside the button.
        UIUtils.setHTML(serviceBtn, buttonHTML);

        // --- END OF UPDATED LOGIC ---

        serviceBtn.dataset.value = service.value;
        
        if (this.state.selectedService.value === service.value) {
            UIUtils.addClass(serviceBtn, 'selected');
        }

        serviceBtn.addEventListener('click', () => { this._handleServiceClick(service, serviceBtn); });
        serviceListContainer.appendChild(serviceBtn);
    });
},
        _handleServiceClick(serviceObj, clickedBtn) {
            this.state.selectedService = { value: serviceObj.value, text: serviceObj.text };
            UIUtils.setValue(this.elements.selectedServiceValueHidden, serviceObj.value);
            UIUtils.setValue(this.elements.selectedServiceTextHidden, serviceObj.text);
            document.querySelectorAll('.service-option-btn.selected').forEach(btn => { UIUtils.removeClass(btn, 'selected'); });
            UIUtils.addClass(clickedBtn, 'selected');
            this._updateBookingSummary();
            this._goToStep('details');
            if (this.elements.nameInput) { UIUtils.focusElement(this.elements.nameInput); }
        },
        _updateBookingSummary() {
            const { bookingSummaryDisplay } = this.elements;
            const { selectedService, selectedFullDate, selectedTime } = this.state;
            if (bookingSummaryDisplay) {
                if (selectedService.text && selectedFullDate && selectedTime) {
                    UIUtils.setText(bookingSummaryDisplay, `${selectedService.text} - ${selectedFullDate}, ${selectedTime}`);
                } else {
                    UIUtils.setText(bookingSummaryDisplay, 'გთხოვთ, შეავსოთ ყველა წინა ველი.');
                }
            }
        },
        _goToStep(stepName) {
            this.state.currentStep = stepName;
            ['date', 'time', 'service', 'details'].forEach(s => {
                const el = this.elements[`${s}Step`];
                if (el) { UIUtils.toggleClass(el, 'active-step', s === stepName); }
            });
            if(this.elements.backButton) {
                (stepName !== 'date') ? UIUtils.showFlexElement(this.elements.backButton) : UIUtils.hideElement(this.elements.backButton);
            }
            if(this.elements.bookingFormWrapper) { this.elements.bookingFormWrapper.scrollTo({top: 0, behavior: 'smooth'}); }
            this._updateBookingSummary();
        },
        _handleBackClick() {
            const cs = this.state.currentStep;
            if (cs === 'time') { this._goToStep('date'); }
            else if (cs === 'service') { this._goToStep('time'); }
            else if (cs === 'details') { this._goToStep('service'); }
        },
        async _handleBookingSubmit(e) {
            e.preventDefault();
            const { bookingConfirmation, bookingForm, nameInput, emailInput, phoneInput } = this.elements;

            if (!bookingConfirmation) return;
            UIUtils.hideElement(bookingConfirmation);
            UIUtils.removeClass(bookingConfirmation, 'error');

            const nameValue = UIUtils.getValue(nameInput);
            const emailValue = UIUtils.getValue(emailInput);
            const phoneValue = UIUtils.getValue(phoneInput);
            const { selectedFullDate, selectedTime, selectedService } = this.state;

            if (!selectedFullDate || !selectedTime || !selectedService.value || !nameValue) {
                UIUtils.setText(bookingConfirmation, 'გთხოვთ, შეავსოთ ყველა სავალდებულო ველი და გააკეთოთ არჩევანი ყველა ეტაპზე.');
                UIUtils.addClass(bookingConfirmation, 'error');
                UIUtils.showElement(bookingConfirmation);
                return;
            }

            if (emailValue && !AppConfig.validationRegex.email.test(emailValue)) {
                UIUtils.setText(bookingConfirmation, 'შეყვანილი ელ. ფოსტა არასწორი ფორმატისაა.');
                UIUtils.addClass(bookingConfirmation, 'error');
                UIUtils.showElement(bookingConfirmation);
                if (emailInput) UIUtils.focusElement(emailInput);
                return;
            }

            if (phoneValue && !AppConfig.validationRegex.phoneGE.test(phoneValue)) {
                UIUtils.setText(bookingConfirmation, 'ტელეფონის ნომერი არასწორია.');
                UIUtils.addClass(bookingConfirmation, 'error');
                UIUtils.showElement(bookingConfirmation);
                if (phoneInput) UIUtils.focusElement(phoneInput);
                return;
            }

            const submitButton = bookingForm?.querySelector('button[type="submit"]');
            if (submitButton) UIUtils.disableElement(submitButton);

            UIUtils.setText(bookingConfirmation, 'მიმდინარეობს ჯავშნის დამუშავება...');
            UIUtils.showElement(bookingConfirmation);

            try {
                const { data, error } = await supaClient
                    .from('bookings')
                    .insert([{
                        date: selectedFullDate,
                        time: selectedTime,
                        service_id: selectedService.value, // It's better to store ID, but name is fine for now
                        service_name: selectedService.text,
                        name: nameValue,
                        email: emailValue,
                        phone: phoneValue || null
                    }]);

                if (error) { throw error; }
                
                UIUtils.setText(bookingConfirmation, 'ჯავშანი წარმატებით გაიგზავნა.');
                UIUtils.removeClass(bookingConfirmation, 'error');
                bookingForm?.reset();
                this.resetStateForNewBooking(); 
                // Invalidate the cache for the day that was just booked
                this.state.availableTimesCache[selectedFullDate] = null;
                setTimeout(() => this._goToStep('date'), 5000);

            } catch (err) {
                console.error("Booking submission error:", err);
                UIUtils.setText(bookingConfirmation, `დაფიქსირდა მოულოდნელი შეცდომა: ${err.message}`);
                UIUtils.addClass(bookingConfirmation, 'error');
                UIUtils.showElement(bookingConfirmation);
            } finally {
                if (submitButton) UIUtils.enableElement(submitButton);
            }
        },
        resetStateForNewBooking() {
            this.state.selectedFullDate = null;
            this.state.selectedTime = null;
            this.state.selectedService = { value: null, text: null };
            document.querySelectorAll('#calendar-grid-main .calendar-day.selected').forEach(cell => UIUtils.removeClass(cell, 'selected'));
            document.querySelectorAll('.time-slot-btn.selected').forEach(btn => UIUtils.removeClass(btn, 'selected'));
            document.querySelectorAll('.service-option-btn.selected').forEach(btn => UIUtils.removeClass(btn, 'selected'));
            if (this.elements.selectedDateDisplayHeader) UIUtils.setText(this.elements.selectedDateDisplayHeader, '');
            this._updateBookingSummary();
        },
        resetToFirstStep(shouldReloadData = true) {
            this.resetStateForNewBooking();
            this._goToStep('date');
            if (shouldReloadData) {
                this.state.availableDatesCache = {}; // Clear date cache too on full reset
                this.state.availableTimesCache = {}; // Clear time cache
                this.loadServicesAndRenderCalendar();
            } else {
                this.renderCalendar();
            }
        }
    };

    const ContactForm = {
        elements: {},
        init() {
            this.elements = {
                form: document.getElementById('contact-form'),
                confirmationMessage: document.getElementById('contact-confirmation-message'),
                nameInput: document.getElementById('contact-name'),
                emailInput: document.getElementById('contact-email'),
                messageInput: document.getElementById('contact-message')
            };
            if(this.elements.form && this.elements.confirmationMessage) {
                this._bindEvents();
            } else {
                console.warn("ContactForm: Form or confirmation message element not found.");
            }
        },
        _bindEvents() {
            if (this.elements.form) {
                this.elements.form.addEventListener('submit', (e) => this._handleSubmit(e));
            }
        },
        async _handleSubmit(e) {
            e.preventDefault();
            const { form, confirmationMessage, nameInput, emailInput, messageInput } = this.elements;
            if (!confirmationMessage) { return; }

            UIUtils.hideElement(confirmationMessage);
            UIUtils.removeClass(confirmationMessage, 'error');

            const nameValue = UIUtils.getValue(nameInput);
            const emailValue = UIUtils.getValue(emailInput);
            const messageValue = UIUtils.getValue(messageInput);

            if (!nameValue || !emailValue || !messageValue) {
                UIUtils.setText(confirmationMessage, 'გთხოვთ, შეავსოთ ყველა ველი.');
                UIUtils.addClass(confirmationMessage, 'error');
                UIUtils.showElement(confirmationMessage);
                return;
            }

            if (!AppConfig.validationRegex.email.test(emailValue)) {
                UIUtils.setText(confirmationMessage, 'შეყვანილი ელ. ფოსტა არასწორი ფორმატისაა. გთხოვთ, შეამოწმოთ.');
                UIUtils.addClass(confirmationMessage, 'error');
                UIUtils.showElement(confirmationMessage);
                if(this.elements.emailInput) UIUtils.focusElement(this.elements.emailInput);
                return;
            }

            const submitButton = form ? form.querySelector('button[type="submit"]') : null;
            if (submitButton) { UIUtils.disableElement(submitButton); }

            UIUtils.setText(confirmationMessage, 'შეტყობინება იგზავნება...');
            UIUtils.removeClass(confirmationMessage, 'error');
            UIUtils.showElement(confirmationMessage);

            const formData = { name: nameValue, email: emailValue, message: messageValue };
            try {
                const response = await ApiService.submitContactForm(formData);
                UIUtils.setText(confirmationMessage, response.message);
                UIUtils.toggleClass(confirmationMessage, 'error', !response.success);
                if (response.success) {
                    if(form) { form.reset(); }
                    setTimeout(() => {
                        if(confirmationMessage) { UIUtils.hideElement(confirmationMessage); }
                    }, 5000);
                }
            } catch (error) {
                console.error("Contact form submission error:", error);
                UIUtils.setText(confirmationMessage, 'დაფიქსირდა მოულოდნელი შეცდომა.');
                UIUtils.addClass(confirmationMessage, 'error');
                UIUtils.showElement(confirmationMessage);
            } finally {
                if (submitButton) { UIUtils.enableElement(submitButton); }
            }
        }
    };

    // --- INITIALIZE ALL MODULES ---
    const currentYearSpan = document.getElementById('current-year');
    if(currentYearSpan) { UIUtils.setText(currentYearSpan, new Date().getFullYear()); }

    SpaNavigator.init();
    window.BookingFlow = BookingFlow;
    if (typeof BookingFlow !== 'undefined' && BookingFlow.init) { BookingFlow.init(); }
    if (typeof ContactForm !== 'undefined' && ContactForm.init) { ContactForm.init(); }

});