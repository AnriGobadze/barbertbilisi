document.addEventListener('DOMContentLoaded', () => {

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    const bookingForm = document.getElementById('booking-form');
    const dateInput = document.getElementById('date');
    const timeSlotsContainer = document.getElementById('time-slots');
    const confirmationMessage = document.getElementById('confirmation-message');
    const selectedTimeInput = document.getElementById('selected-time');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    const availableTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30'
    ];

    const today = new Date().toISOString().split('T')[0];
    if(dateInput) { // Check if element exists before setting attribute
        dateInput.setAttribute('min', today);
    }

    function generateTimeSlots(selectedDateStr) {
       if(!timeSlotsContainer) return; // Exit if container not found

       timeSlotsContainer.innerHTML = '';
       if (selectedTimeInput) selectedTimeInput.value = '';

       if (!selectedDateStr) {
           timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">Select date</p>';
           return;
       }
       const selectedDate = new Date(selectedDateStr + 'T00:00:00');
       const now = new Date();
       const isToday = selectedDate.toDateString() === now.toDateString();
       let hasAvailableSlots = false;

       availableTimes.forEach(time => {
            const [hours, minutes] = time.split(':');
            const slotTime = new Date(selectedDate);
            slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('time-slot');
            button.textContent = time;
            button.dataset.time = time;

            if (isToday && slotTime < now) {
                button.classList.add('disabled');
                button.disabled = true;
            } else {
                hasAvailableSlots = true;
                button.addEventListener('click', () => {
                    const currentSelected = timeSlotsContainer.querySelector('.time-slot.selected');
                    if (currentSelected) currentSelected.classList.remove('selected');
                    button.classList.add('selected');
                    if (selectedTimeInput) selectedTimeInput.value = time;
                });
            }
           timeSlotsContainer.appendChild(button);
       });

       if (!hasAvailableSlots && availableTimes.length > 0) {
           timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">No times left today</p>';
       } else if (availableTimes.length === 0 && selectedDateStr) {
            // Only show unavailable if a date is actually selected and the array was empty
           timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">Unavailable</p>';
       } else if (!hasAvailableSlots && availableTimes.length === 0){
             timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">No slots defined</p>'; // Fallback
       }
    }

    if(dateInput) {
        dateInput.addEventListener('change', (event) => generateTimeSlots(event.target.value));
        generateTimeSlots(dateInput.value);
    }

    if(bookingForm){
        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if(confirmationMessage){
                 confirmationMessage.style.display = 'none';
                 confirmationMessage.classList.remove('error');
            }

           const service = bookingForm.service.value;
           const barber = bookingForm.barber.value;
           const date = dateInput.value;
           const time = selectedTimeInput ? selectedTimeInput.value : '';
           const email = emailInput ? emailInput.value.trim() : '';
           const phone = phoneInput ? phoneInput.value.trim() : '';

            let errorMessage = '';
            if (!service) errorMessage += 'Select Service. ';
            if (!date) errorMessage += 'Select Date. ';
            if (!time) errorMessage += 'Select Time. ';
            if (!email) errorMessage += 'Enter Email. ';
            else if (!/\S+@\S+\.\S+/.test(email)) errorMessage += 'Valid Email required. ';

            if (errorMessage && confirmationMessage) {
               confirmationMessage.textContent = errorMessage.trim();
               confirmationMessage.classList.add('error');
               confirmationMessage.style.display = 'block';
               return;
            }

            if(confirmationMessage) {
                 confirmationMessage.textContent = `Request sent for ${service} on ${date} at ${time}. Check ${email} for confirmation/details.`;
                 confirmationMessage.classList.remove('error');
                 confirmationMessage.style.display = 'block';
                 setTimeout(() => { confirmationMessage.style.display = 'none'; }, 10000);
            }
           console.log("Simulating Booking:", { service, barber, date, time, email, phone });
           // bookingForm.reset();
           // generateTimeSlots(null);
        });
    }


    const contactForm = document.getElementById('contact-form');
    const contactConfirmationMessage = document.getElementById('contact-confirmation-message');
    const contactNameInput = document.getElementById('contact-name');
    const contactEmailInput = document.getElementById('contact-email');
    const contactSubjectInput = document.getElementById('contact-subject');
    const contactMessageInput = document.getElementById('contact-message');

    if(contactForm) {
        contactForm.addEventListener('submit', (event) => {
           event.preventDefault();
           if(contactConfirmationMessage) {
                contactConfirmationMessage.style.display = 'none';
                contactConfirmationMessage.classList.remove('error');
           }

           const name = contactNameInput ? contactNameInput.value.trim() : '';
           const email = contactEmailInput ? contactEmailInput.value.trim() : '';
           const subject = contactSubjectInput ? contactSubjectInput.value : '';
           const message = contactMessageInput ? contactMessageInput.value.trim() : '';

            let contactError = '';
            if (!name) contactError += 'Name required. ';
            if (!email) contactError += 'Email required. ';
            else if (!/\S+@\S+\.\S+/.test(email)) contactError += 'Valid email required. ';
            if (!subject) contactError += 'Subject required. ';
            if (!message) contactError += 'Message required. ';


            if (contactError && contactConfirmationMessage) {
                contactConfirmationMessage.textContent = contactError.trim();
               contactConfirmationMessage.classList.add('error');
               contactConfirmationMessage.style.display = 'block';
               return;
            }

            if(contactConfirmationMessage){
                contactConfirmationMessage.textContent = `Thanks, ${name}! We received your message and will reply to ${email} soon.`;
                contactConfirmationMessage.classList.remove('error');
                contactConfirmationMessage.style.display = 'block';
                setTimeout(() => { contactConfirmationMessage.style.display = 'none'; }, 8000);
            }
           console.log("Simulating Contact:", { name, email, subject, message });
           contactForm.reset();
        });
    }

    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
    scrollElements.forEach(el => scrollObserver.observe(el));

});