document.addEventListener('DOMContentLoaded', () => {
    const spaLinks = document.querySelectorAll('.spa-link');
    const pageSections = document.querySelectorAll('.page-section');
    const navMenuLinks = document.querySelectorAll('.navbar .nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const mainContentArea = document.getElementById('main-content');

    function switchActiveSection(targetId) {
        if (!targetId) return;
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
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
            if (targetId === 'hero') {
                navLogo.classList.add('active');
            } else {
                navLogo.classList.remove('active');
            }
        }
        if (mainContentArea) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
            const targetScrollPosition = mainContentArea.offsetTop - navbarHeight - 10;
            window.scrollTo({
                top: targetScrollPosition > 0 ? targetScrollPosition : 0,
                behavior: 'smooth'
            });
        }
    }

    spaLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                event.preventDefault();
                const targetId = href.substring(1);
                switchActiveSection(targetId);
                if (hamburger && hamburger.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
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

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    const timeSlotsContainer = document.getElementById('time-slots');
    const selectedTimeInput = document.getElementById('selected-time');
    const availableTimes = ["09:00", "09:45", "10:30", "11:15", "12:00", "13:30", "14:15", "15:00", "15:45", "16:30", "17:15"];
    const generateTimeSlots = () => {
        if (!timeSlotsContainer) return;
        timeSlotsContainer.innerHTML = '';
        if (!dateInput || !dateInput.value) {
            timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">აირჩიეთ თარიღი დროების სანახავად</p>';
            return;
        }
        const dayOfWeek = new Date(dateInput.value + 'T00:00:00').getDay();
        let timesToShow = [...availableTimes];
        if (dayOfWeek === 0 || dayOfWeek === 1) timesToShow = [];
        else if (dayOfWeek === 6) timesToShow = timesToShow.filter(time => time < "17:00");
        else timesToShow = timesToShow.filter(() => Math.random() > 0.25);
        if (timesToShow.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">ამ თარიღზე თავისუფალი დროები არ არის.</p>';
        } else {
            timesToShow.forEach(time => {
                const slot = document.createElement('button');
                slot.type = 'button';
                slot.classList.add('time-slot');
                slot.textContent = time;
                slot.dataset.time = time;
                timeSlotsContainer.appendChild(slot);
            });
        }
    };
    if (dateInput) dateInput.addEventListener('change', generateTimeSlots);
    if (timeSlotsContainer && selectedTimeInput) {
        timeSlotsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-slot') && !e.target.classList.contains('disabled')) {
                timeSlotsContainer.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTimeInput.value = e.target.dataset.time;
            }
        });
    }

    const bookingForm = document.getElementById('booking-form');
    const bookingConfirmation = document.getElementById('booking-confirmation-message');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            bookingConfirmation.style.display = 'none';
            bookingConfirmation.classList.remove('error');
            const serviceSelect = document.getElementById('service');
            const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
            const dateValue = dateInput ? dateInput.value : null;
            const timeValue = selectedTimeInput ? selectedTimeInput.value : null;
            const nameValue = document.getElementById('name')?.value;
            const emailValue = document.getElementById('email')?.value;
            if (!serviceSelect.value || !dateValue || !timeValue || !nameValue || !emailValue) {
                bookingConfirmation.textContent = 'გთხოვთ, შეავსოთ ყველა სავალდებულო ველი და აირჩიოთ დრო.';
                bookingConfirmation.className = 'confirmation-message error';
                bookingConfirmation.style.display = 'block';
                return;
            }
            bookingConfirmation.innerHTML = `<strong>გმადლობთ, ${nameValue}!</strong><br> თქვენი მოთხოვნა <strong>${serviceText}</strong> სერვისზე <strong>${dateValue}</strong>, <strong>${timeValue}</strong> დროზე მიღებულია. დასტურისთვის შეამოწმეთ ${emailValue}.`;
            bookingConfirmation.className = 'confirmation-message';
            bookingConfirmation.style.display = 'block';
        });
    }

    const contactForm = document.getElementById('contact-form');
    const contactConfirmation = document.getElementById('contact-confirmation-message');
    if (contactForm) {
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
        });
    }

    if (dateInput) {
        generateTimeSlots();
    }
});
