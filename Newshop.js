document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for SPA Navigation & Mobile Menu ---
    const spaLinks = document.querySelectorAll('.spa-link');
    const pageSections = document.querySelectorAll('.page-section');
    const navMenuLinks = document.querySelectorAll('.navbar .nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const mainContentArea = document.getElementById('main-content');
    const currentYearSpan = document.getElementById('current-year');

    if(currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- SPA Navigation Function ---
    function switchActiveSection(targetId) {
        if (!targetId || targetId === '#') targetId = 'hero';

        let sectionFound = false;
        pageSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active-section');
                sectionFound = true;
            } else {
                section.classList.remove('active-section');
            }
        });

        if (!sectionFound) {
            document.getElementById('hero')?.classList.add('active-section');
            targetId = 'hero';
        }

        navMenuLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`);
        });
        
        document.querySelector('.nav-logo')?.classList.toggle('active', targetId === 'hero');
        
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
        const targetSectionElement = document.getElementById(targetId);

        if (targetSectionElement) {
            let scrollToY;
            if (targetId === 'hero') {
                scrollToY = 0;
            } else {
                scrollToY = targetSectionElement.offsetTop - navbarHeight - 10;
            }
            window.scrollTo({ top: scrollToY > 0 ? scrollToY : 0, behavior: 'smooth' });
        }

        if (targetId === 'booking' && window.bookingFlow && typeof window.bookingFlow.resetToFirstStep === 'function') {
            window.bookingFlow.resetToFirstStep();
        }
    }

    spaLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                event.preventDefault();
                const targetId = href.substring(1);
                switchActiveSection(targetId);
                if (hamburger?.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu?.classList.remove('active');
                }
            }
        });
    });

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // --- Hero Section Logic (No toggle needed now) ---
    // JavaScript for Hero dropdown is removed.

    // --- Booking Section Logic (New Flow) ---
    window.bookingFlow = (() => {
        const steps = {
            date: document.getElementById('date-selection-step'),
            time: document.getElementById('time-selection-step'),
            service: document.getElementById('service-selection-step'),
            details: document.getElementById('user-details-step')
        };
        const backButton = document.getElementById('booking-back-button');
        const currentMonthYearDisplay = document.getElementById('current-month-year-display');
        const prevMonthBtn = document.getElementById('prev-month-btn');
        const nextMonthBtn = document.getElementById('next-month-btn');
        const calendarGrid = document.getElementById('calendar-grid-main');
        const calendarDaysHeader = document.getElementById('calendar-days-header');
        const selectedDateDisplayHeader = document.getElementById('selected-date-display-header');
        const morningSlotsContainer = document.getElementById('morning-slots');
        const daySlotsContainer = document.getElementById('day-slots');
        const eveningSlotsContainer = document.getElementById('evening-slots');
        const noTimeSlotsMessage = document.getElementById('no-time-slots-message');
        const serviceListContainer = document.getElementById('service-list-container');
        const bookingSummaryDisplay = document.getElementById('booking-summary-display');
        const selectedDateHidden = document.getElementById('selected-date-hidden');
        const selectedTimeHidden = document.getElementById('selected-time-hidden');
        const selectedServiceValueHidden = document.getElementById('selected-service-value-hidden');
        const selectedServiceTextHidden = document.getElementById('selected-service-text-hidden');
        const bookingForm = document.getElementById('booking-form');
        const bookingConfirmation = document.getElementById('booking-confirmation-message');

        let currentDisplayDate = new Date();
        let selectedFullDate = null;
        let selectedTime = null;
        let selectedService = { value: null, text: null };
        let currentStep = 'date';

        const GeorgianMonths = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
        const GeorgianDaysShort = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

        const servicesAvailable = [
            { value: "ზუსტი თმის შეჭრა", text: "ზუსტი თმის შეჭრა" },
            { value: "წვერის მოდელირება", text: "წვერის მოდელირება" },
            { value: "მკვეთრი გადაყვანა", text: "მკვეთრი გადაყვანა" },
            { value: "განახლება და დავარცხნა", text: "განახლება და დავარცხნა" },
            { value: "თმის ტონირება", text: "თმის ტონირება (შენიღბვა)" },
            { value: "მამა-შვილის შეჭრა", text: "მამა-შვილის შეჭრა" },
            { value: "შეჭრა და წვერის კომბო", text: "შეჭრა და წვერის კომბო (მოკლე)" }
        ];

        const ALL_TIME_SLOTS_CATEGORIZED = {
            morning: ["11:00", "11:45"],
            day: ["12:30", "13:15", "14:00", "14:45", "15:30", "16:15", "17:00", "17:45"],
            evening: ["18:30", "19:15", "20:00"]
        };
        
        function getMockDateAvailability(dateObj) {
            if (Math.random() < 0.05) return false;
            return true;
        }

        function renderCalendar() {
            if (!calendarGrid || !currentMonthYearDisplay || !prevMonthBtn || !nextMonthBtn) return;
            calendarGrid.innerHTML = '';
            const month = currentDisplayDate.getMonth();
            const year = currentDisplayDate.getFullYear();
            currentMonthYearDisplay.textContent = `${GeorgianMonths[month]} ${year}`;

            const firstDayOfMonthDate = new Date(year, month, 1);
            let firstDayOfMonthWeekday = firstDayOfMonthDate.getDay();
            firstDayOfMonthWeekday = (firstDayOfMonthWeekday === 0) ? 6 : firstDayOfMonthWeekday - 1;

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const oneMonthFromToday = new Date(today);
            oneMonthFromToday.setDate(today.getDate() + 30);


            prevMonthBtn.disabled = (year === today.getFullYear() && month === today.getMonth());
            const nextMonthToDisplay = new Date(year, month + 1, 1);
            nextMonthBtn.disabled = nextMonthToDisplay > oneMonthFromToday;


            for (let i = 0; i < firstDayOfMonthWeekday; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('calendar-day', 'empty');
                calendarGrid.appendChild(emptyCell);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');
                dayCell.textContent = day;
                dayCell.dataset.day = String(day);

                const currentDate = new Date(year, month, day);
                currentDate.setHours(0,0,0,0);

                if (currentDate < today || currentDate > oneMonthFromToday) {
                    dayCell.classList.add('disabled');
                } else {
                    if (getMockDateAvailability(currentDate)) {
                        dayCell.classList.add('has-slots');
                    } else {
                        dayCell.classList.add('disabled');
                    }
                }
                if (currentDate.getTime() === today.getTime()) dayCell.classList.add('today');
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (selectedFullDate === dateStr) dayCell.classList.add('selected');
                
                if (!dayCell.classList.contains('disabled')) {
                    dayCell.addEventListener('click', () => handleDayClick(day, month, year, dayCell));
                }
                calendarGrid.appendChild(dayCell);
            }
        }

        function handleDayClick(day, month, year, clickedCell) {
            selectedFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            selectedDateHidden.value = selectedFullDate;

            document.querySelectorAll('#calendar-grid-main .calendar-day.selected').forEach(cell => cell.classList.remove('selected'));
            clickedCell.classList.add('selected');
            
            if(selectedDateDisplayHeader) selectedDateDisplayHeader.textContent = `(${selectedFullDate})`;
            renderTimeSlotsForDate(new Date(year, month, day));
            goToStep('time');
        }
        
        function getAvailableTimesForDate(dateObj) {
            let times = JSON.parse(JSON.stringify(ALL_TIME_SLOTS_CATEGORIZED));
            for (const category in times) {
                times[category] = times[category].filter(() => Math.random() > 0.25);
            }
            return times;
        }

        function renderTimeSlotsForDate(dateObject) {
            if(!morningSlotsContainer || !daySlotsContainer || !eveningSlotsContainer || !noTimeSlotsMessage) return;

            const availableTimes = getAvailableTimesForDate(dateObject);
            let totalSlotsAvailable = 0;
            [morningSlotsContainer, daySlotsContainer, eveningSlotsContainer].forEach(c => c.innerHTML = '');

            function populateCategory(container, timesArray) {
                if (timesArray.length > 0) {
                    totalSlotsAvailable += timesArray.length;
                    timesArray.forEach(time => {
                        const slotBtn = document.createElement('button');
                        slotBtn.type = 'button';
                        slotBtn.classList.add('time-slot-btn');
                        slotBtn.textContent = time;
                        slotBtn.dataset.time = time;
                        if (selectedTime === time) slotBtn.classList.add('selected');
                        slotBtn.addEventListener('click', () => handleTimeClick(time, slotBtn));
                        container.appendChild(slotBtn);
                    });
                }
            }
            populateCategory(morningSlotsContainer, availableTimes.morning);
            populateCategory(daySlotsContainer, availableTimes.day);
            populateCategory(eveningSlotsContainer, availableTimes.evening);
            
            noTimeSlotsMessage.style.display = totalSlotsAvailable === 0 ? 'block' : 'none';
        }
        
        function handleTimeClick(time, clickedBtn) {
            selectedTime = time;
            selectedTimeHidden.value = time;
            document.querySelectorAll('.time-slot-btn.selected').forEach(btn => btn.classList.remove('selected'));
            clickedBtn.classList.add('selected');
            renderServiceList();
            goToStep('service');
        }
        
        function renderServiceList() {
            if(!serviceListContainer) return;
            serviceListContainer.innerHTML = '';
            servicesAvailable.forEach(service => {
                const serviceBtn = document.createElement('button');
                serviceBtn.type = 'button';
                serviceBtn.classList.add('service-option-btn');
                serviceBtn.textContent = service.text;
                serviceBtn.dataset.value = service.value;
                if(selectedService.value === service.value) serviceBtn.classList.add('selected');
                serviceBtn.addEventListener('click', () => handleServiceClick(service, serviceBtn));
                serviceListContainer.appendChild(serviceBtn);
            });
        }

        function handleServiceClick(serviceObj, clickedBtn) {
            selectedService = { value: serviceObj.value, text: serviceObj.text };
            selectedServiceValueHidden.value = serviceObj.value;
            selectedServiceTextHidden.value = serviceObj.text;
            document.querySelectorAll('.service-option-btn.selected').forEach(btn => btn.classList.remove('selected'));
            clickedBtn.classList.add('selected');
            updateBookingSummary();
            goToStep('details');
        }

        function updateBookingSummary() {
            if (bookingSummaryDisplay && selectedService.text && selectedFullDate && selectedTime) {
                bookingSummaryDisplay.textContent = `${selectedService.text} - ${selectedFullDate}, ${selectedTime}`;
            } else if (bookingSummaryDisplay) {
                bookingSummaryDisplay.textContent = 'გთხოვთ, შეავსოთ ყველა წინა ველი.';
            }
        }

        function goToStep(stepName) {
            currentStep = stepName;
            Object.values(steps).forEach(stepEl => stepEl?.classList.remove('active-step'));
            if (steps[stepName]) steps[stepName].classList.add('active-step');
            if (backButton) backButton.style.display = (stepName !== 'date') ? 'flex' : 'none';
            document.querySelector('.booking-form-wrapper')?.scrollTo(0, 0);
        }

        function handleBackClick() {
            if (currentStep === 'time') goToStep('date');
            else if (currentStep === 'service') goToStep('time');
            else if (currentStep === 'details') goToStep('service');
        }
        
        function resetToFirstStep() {
            selectedFullDate = null; selectedTime = null; selectedService = { value: null, text: null };
            if(selectedDateHidden) selectedDateHidden.value = '';
            if(selectedTimeHidden) selectedTimeHidden.value = '';
            if(selectedServiceValueHidden) selectedServiceValueHidden.value = '';
            if(selectedServiceTextHidden) selectedServiceTextHidden.value = '';
            
            if (bookingForm) bookingForm.reset();
            if (bookingConfirmation) {
                bookingConfirmation.style.display = 'none';
                bookingConfirmation.classList.remove('error');
            }
            currentDisplayDate = new Date();
            renderCalendar();
            goToStep('date');
        }

        if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1); renderCalendar(); });
        if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1); renderCalendar(); });
        if(backButton) backButton.addEventListener('click', handleBackClick);

        if(bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if(bookingConfirmation) {
                    bookingConfirmation.style.display = 'none';
                    bookingConfirmation.classList.remove('error');
                }

                const nameValue = document.getElementById('name')?.value;
                const emailValue = document.getElementById('email')?.value;

                if (!selectedFullDate || !selectedTime || !selectedService.value || !nameValue || !emailValue) {
                    if(bookingConfirmation) {
                        bookingConfirmation.textContent = 'გთხოვთ, შეავსოთ ყველა სავალდებულო ველი და გააკეთოთ არჩევანი ყველა ეტაპზე.';
                        bookingConfirmation.className = 'confirmation-message error';
                        bookingConfirmation.style.display = 'block';
                    }
                    return;
                }
                if(bookingConfirmation) {
                    bookingConfirmation.innerHTML = `<strong>გმადლობთ, ${nameValue}!</strong><br> თქვენი მოთხოვნა <strong>${selectedService.text}</strong> სერვისზე <strong>${selectedFullDate}</strong>, <strong>${selectedTime}</strong> დროზე მიღებულია. დასტურისთვის შეამოწმეთ ${emailValue}.`;
                    bookingConfirmation.className = 'confirmation-message';
                    bookingConfirmation.style.display = 'block';
                }
                setTimeout(resetToFirstStep, 5000);
            });
        }

        if(calendarDaysHeader) calendarDaysHeader.innerHTML = GeorgianDaysShort.map(day => `<span>${day}</span>`).join('');
        renderCalendar();
        goToStep('date');
        
        return { resetToFirstStep };
    })();

    // --- Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    const contactConfirmation = document.getElementById('contact-confirmation-message');
    if (contactForm && contactConfirmation) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            contactConfirmation.style.display = 'none';
            contactConfirmation.classList.remove('error');
            const nameValue = document.getElementById('contact-name')?.value;
            const emailValue = document.getElementById('contact-email')?.value;
            const messageValue = document.getElementById('contact-message')?.value;

            if (!nameValue || !emailValue || !messageValue) {
                contactConfirmation.textContent = 'გთხოვთ, შეავსოთ ყველა ველი.';
                contactConfirmation.className = 'confirmation-message error';
                contactConfirmation.style.display = 'block';
                return;
            }
            contactConfirmation.textContent = `შეტყობინება გაგზავნილია! გმადლობთ, ${nameValue}. მალე გიპასუხებთ ${emailValue}-ზე.`;
            contactConfirmation.className = 'confirmation-message';
            contactConfirmation.style.display = 'block';
            contactForm.reset();
            setTimeout(() => { contactConfirmation.style.display = 'none'; }, 5000);
        });
    }

    // --- Initial Page Load ---
    const initialHash = window.location.hash;
    if (initialHash && initialHash !== "#" && document.getElementById(initialHash.substring(1))) {
        switchActiveSection(initialHash.substring(1));
    } else {
        switchActiveSection('hero');
    }
});