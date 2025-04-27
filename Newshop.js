document.addEventListener('DOMContentLoaded', () => {

    // --- Selectors ---
    const spaLinks = document.querySelectorAll('.spa-link');
    const pageSections = document.querySelectorAll('.page-section');
    const navMenuLinks = document.querySelectorAll('.navbar .nav-link'); // More specific selector for nav highlight
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const mainContentArea = document.getElementById('main-content');

    // --- Section Switching Function ---
    function switchActiveSection(targetId) {
        // Guard clause
        if (!targetId) return;

        let sectionFound = false;
        // Hide all sections and check if target exists
        pageSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active-section');
                sectionFound = true;
            } else {
                section.classList.remove('active-section');
            }
        });

        // Fallback if the targetId doesn't match any section
        if (!sectionFound) {
            console.warn(`Target section "#${targetId}" not found. Showing #hero.`);
            document.getElementById('hero')?.classList.add('active-section');
            targetId = 'hero'; // Update targetId for nav highlight
        }

        // Update Navbar Highlight
        navMenuLinks.forEach(link => {
            // Check if link's href corresponds to the now active section ID
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

         // Handle logo "active" state if needed (e.g., when home is active)
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
            if (targetId === 'hero') {
                navLogo.classList.add('active'); // You might style .nav-logo.active
            } else {
                navLogo.classList.remove('active');
            }
         }

        // Optional: Scroll to top of content area, accounting for fixed navbar
        if (mainContentArea) {
             const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70; // Get actual or default height
             const targetScrollPosition = mainContentArea.offsetTop - navbarHeight - 10; // Add small buffer
             window.scrollTo({
                 top: targetScrollPosition > 0 ? targetScrollPosition : 0, // Prevent negative scroll values
                 behavior: 'smooth'
             });
         }
    }

    // --- Event Listeners for SPA Links ---
    spaLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                event.preventDefault(); // Stop default anchor jump
                const targetId = href.substring(1); // Get ID without '#'
                switchActiveSection(targetId);

                // Close mobile menu if open
                if (hamburger && hamburger.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // --- Hamburger Menu Toggle ---
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // --- Minimum Date for Input ---
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // --- Time Slot Logic (No changes needed from previous) ---
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
        // Simplified demo availability - replace with real logic if needed
        const dayOfWeek = new Date(dateInput.value + 'T00:00:00').getDay();
        let timesToShow = [...availableTimes];
        if (dayOfWeek === 0 || dayOfWeek === 1) timesToShow = [];
        else if (dayOfWeek === 6) timesToShow = timesToShow.filter(time => time < "17:00"); // Sat cutoff 5 PM
        else timesToShow = timesToShow.filter(() => Math.random() > 0.25); // Randomly remove ~25%

         if (timesToShow.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="time-slot-placeholder">ამ თარიღზე თავისუფალი დროები არ არის.</p>';
         } else {
            timesToShow.forEach(time => {
                 const slot = document.createElement('button');
                 slot.type = 'button'; slot.classList.add('time-slot'); slot.textContent = time; slot.dataset.time = time;
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

    // --- Form Submissions (No changes needed from previous) ---
    const bookingForm = document.getElementById('booking-form');
    const bookingConfirmation = document.getElementById('booking-confirmation-message');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
             e.preventDefault();
             bookingConfirmation.style.display = 'none'; bookingConfirmation.classList.remove('error');
             // Validation
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
             // Success
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
            contactConfirmation.style.display = 'none'; contactConfirmation.classList.remove('error');
            // Validation
            const nameValue = document.getElementById('contact-name')?.value;
            const emailValue = document.getElementById('contact-email')?.value;
            const messageValue = document.getElementById('contact-message')?.value;
            if (!nameValue || !emailValue || !messageValue) {
                contactConfirmation.textContent = 'გთხოვთ, შეავსოთ ყველა ველი.';
                contactConfirmation.className = 'confirmation-message error';
                contactConfirmation.style.display = 'block';
                return;
            }
            // Success
            contactConfirmation.textContent = `შეტყობინება გაგზავნილია! გმადლობთ, ${nameValue}. მალე გიპასუხებთ ${emailValue}-ზე.`;
            contactConfirmation.className = 'confirmation-message';
            contactConfirmation.style.display = 'block';
        });
    }

    // --- Initial Setup ---
    // The page should load with #hero visible due to the initial HTML class.
    // If you prefer JS to handle initial state, remove 'active-section' from #hero
    // in HTML and uncomment the line below:
    // switchActiveSection('hero');

     // Trigger generation of time slots placeholder initially if date input exists
     if (dateInput) {
         generateTimeSlots();
     }

     // --- Scroll Animations (Keep removed if not desired/needed) ---

}); // End DOMContentLoaded