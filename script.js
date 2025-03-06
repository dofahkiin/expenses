let currentDisplayedDate = new Date();
let currentExpensesFile = 'at_expenses.json';
let currentExpensesData = [];
let currentTheme = localStorage.getItem('theme') || 'light';

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);
document.getElementById('theme-toggle').checked = currentTheme === 'dark';
updateThemeIcon(currentTheme);

// Icons for different expense types (you can customize these)
const expenseIcons = {
    "default": "fas fa-receipt",
    "cleverfit": "fas fa-dumbbell",
    "umbau": "fas fa-building",
    "magenta": "fas fa-wifi",
    "sparkasse savings": "fas fa-euro-sign",
    "apple": "fab fa-apple",
    "sparkasse expenses": "fas fa-euro-sign",
    "drei": "fas fa-mobile-alt",
    "kredit": "fas fa-money-bill-wave",
    "internet": "fas fa-wifi",
    "struja": "fas fa-bolt",
    "cistoca": "fas fa-broom",
    "zev": "fas fa-building",
    "di.fm": "fas fa-music",
    "spotify": "fas fa-music",
    "mobilni": "fas fa-mobile-alt",
    "sparkasse": "fas fa-euro-sign"
};

// Helper function to update theme icon
function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon theme-icon';
    } else {
        themeIcon.className = 'fas fa-sun theme-icon';
    }
}

// Helper function to get appropriate icon for an expense
function getExpenseIcon(expenseName) {
    const lowerName = expenseName.toLowerCase();
    for (const [key, icon] of Object.entries(expenseIcons)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    return expenseIcons.default;
}

async function loadExpenses(filename) {
    const response = await fetch(filename);
    const data = await response.json();
    return data.expenses;
}

function isExpenseVisible(expense, currentDate, currentExpensesFile) {
    const currentMonth = currentDate.getMonth();

    if (currentExpensesFile === 'at_expenses.json') {
        if (expense.month === "all") {
            return true;
        }

        if (expense.month === "quarterly") {
            return currentMonth === 2 || currentMonth === 5 || currentMonth === 8 || currentMonth === 11;
        }

        if (expense.month === "february") {
            return currentMonth === 1;
        }
    } else {
        if (expense.month === "all") {
            return true;
        }
    }
    return false;
}

function createExpenseRow(expense, currentDate) {
    const row = document.createElement('tr');
    const dayCell = document.createElement('td');
    const expenseCell = document.createElement('td');
    const priceCell = document.createElement('td');

    dayCell.textContent = expense.day;
    dayCell.className = 'day-column';

    // Add icon to expense
    const icon = document.createElement('i');
    icon.className = `${getExpenseIcon(expense.expense)} expense-icon`;
    expenseCell.appendChild(icon);
    expenseCell.appendChild(document.createTextNode(expense.expense));

    priceCell.textContent = expense.price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    priceCell.className = 'expense-amount price-column';

    row.appendChild(dayCell);
    row.appendChild(expenseCell);
    row.appendChild(priceCell);

    const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), expense.day);
    const todayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    if (expenseDate <= todayDate) {
        row.classList.add('past');
    } else {
        row.classList.add('upcoming');
    }

    return row;
}

function calculateTotalRemainingExpenses(expenses, currentDate) {
    let totalRemainingExpenses = 0;
    const todayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    for (const expense of expenses) {
        if (isExpenseVisible(expense, currentDate, currentExpensesFile)) {
            const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), expense.day);

            if (expenseDate > todayDate) {
                totalRemainingExpenses += expense.price;
            }
        }
    }
    return totalRemainingExpenses;
}

function updateCurrentMonthDisplay(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthDisplay = document.getElementById('current-month');
    currentMonthDisplay.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

async function updateExpensesTable(date) {
    const expenses = await loadExpenses(currentExpensesFile);
    currentExpensesData = expenses;
    const tableBody = document.getElementById('expenses-table-body');
    tableBody.innerHTML = '';

    const filteredExpenses = expenses.filter(expense => {
        const expenseMonth = expense.month;
        if (expenseMonth === "all" || expenseMonth === "quarterly") {
            return isExpenseVisible(expense, date, currentExpensesFile);
        }

        if (currentExpensesFile === 'at_expenses.json') {
            const expenseMonthIndex = new Date(Date.parse(expenseMonth + " 1, 2023")).getMonth();
            return date.getMonth() === expenseMonthIndex;
        } else {
            return false;
        }
    });

    for (const expense of filteredExpenses) {
        const row = createExpenseRow(expense, date);
        tableBody.appendChild(row);
    }

    const totalRemaining = calculateTotalRemainingExpenses(filteredExpenses, date);
    document.getElementById('total-remaining-expenses').textContent = totalRemaining.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function navigateToPreviousMonth() {
    currentDisplayedDate.setMonth(currentDisplayedDate.getMonth() - 1);
    updateExpensesTable(currentDisplayedDate);
    updateCurrentMonthDisplay(currentDisplayedDate);
    updateDaySelect();
}

function navigateToNextMonth() {
    currentDisplayedDate.setMonth(currentDisplayedDate.getMonth() + 1);
    updateExpensesTable(currentDisplayedDate);
    updateCurrentMonthDisplay(currentDisplayedDate);
    updateDaySelect();
}

function toggleLocationButton(buttonId) {
    const atButton = document.getElementById('at-button');
    const bhButton = document.getElementById('bh-button');

    if (buttonId === "at-button") {
        atButton.classList.add('active');
        bhButton.classList.remove('active');
    } else {
        bhButton.classList.add('active');
        atButton.classList.remove('active');
    }
}

function updateDaySelect() {
    const daySelect = document.getElementById('day-select');
    daySelect.innerHTML = ''; // Clear existing options

    const daysInMonth = new Date(currentDisplayedDate.getFullYear(), currentDisplayedDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        daySelect.appendChild(option);
    }
    daySelect.value = currentDisplayedDate.getDate();
}

// Function to switch the theme
function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon('dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeIcon('light');
    }
}

// Function to check if the day needs to be updated
function checkAndUpdateCurrentDay() {
    const today = new Date();
    
    // Check if we're on the same day
    if (today.getDate() !== currentDisplayedDate.getDate() || 
        today.getMonth() !== currentDisplayedDate.getMonth() ||
        today.getFullYear() !== currentDisplayedDate.getFullYear()) {
        
        // Update the current date to today
        currentDisplayedDate = today;
        
        // Update the day select dropdown
        updateDaySelect();
        
        // Update the expenses table with the new date
        updateExpensesTable(currentDisplayedDate);
        updateCurrentMonthDisplay(currentDisplayedDate);
    }
}

// Add an event listener for when the page becomes visible again
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page has become visible again (user returned to the app)
        checkAndUpdateCurrentDay();
    }
});

// Also check when the page loads initially
window.addEventListener('load', function() {
    checkAndUpdateCurrentDay();
});

// Event Listeners
document.getElementById('prev-month').addEventListener('click', navigateToPreviousMonth);
document.getElementById('next-month').addEventListener('click', navigateToNextMonth);

document.getElementById('at-button').addEventListener('click', () => {
    currentExpensesFile = 'at_expenses.json';
    toggleLocationButton('at-button');
    updateExpensesTable(currentDisplayedDate);
});

document.getElementById('bh-button').addEventListener('click', () => {
    currentExpensesFile = 'bh_expenses.json';
    toggleLocationButton('bh-button');
    updateExpensesTable(currentDisplayedDate);
});

document.getElementById('day-select').addEventListener('change', () => {
    const selectedDay = parseInt(document.getElementById('day-select').value);
    currentDisplayedDate.setDate(selectedDay);
    updateExpensesTable(currentDisplayedDate);
});

// Theme toggle event listener
document.getElementById('theme-toggle').addEventListener('change', switchTheme);

// Initial setup
updateExpensesTable(currentDisplayedDate);
updateCurrentMonthDisplay(currentDisplayedDate);
updateDaySelect();