const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");
const transactionList = document.getElementById("transaction-list");
const transactionCount = document.getElementById("transaction-count");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const formMessage = document.getElementById("form-message");
const categoryChart = document.getElementById("category-chart");
const categoryLegend = document.getElementById("category-legend");

const STORAGE_KEY = "spendwise-transactions-v1";

const categoryColors = {
  Food: "#f59e0b",
  Transport: "#4385f5",
  Shopping: "#e66ba8",
  Bills: "#8b6cf6",
  Health: "#16a085",
  Entertainment: "#ef7655",
  Education: "#4c9bdb",
  Salary: "#21a179",
  Freelance: "#8a75df",
  Other: "#9b9bad"
};

const categoryIcons = {
  Food: "🍽",
  Transport: "🚗",
  Shopping: "🛍",
  Bills: "🧾",
  Health: "💊",
  Entertainment: "🎬",
  Education: "📚",
  Salary: "💼",
  Freelance: "💻",
  Other: "📌"
};

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

dateInput.value = getLocalDate();

document.getElementById("today-date").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.description === "string" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      ["income", "expense"].includes(item.type) &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    );
  } catch (error) {
    console.error("Could not load saved transactions:", error);
    return [];
  }
}

let transactions = loadTransactions();

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Could not save transactions:", error);
    showMessage("Could not save data in this browser.", true);
    return false;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const [year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateSummary() {
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const balance = totalIncome - totalExpenses;

  balanceElement.textContent = formatCurrency(balance);
  incomeElement.textContent = formatCurrency(totalIncome);
  expensesElement.textContent = formatCurrency(totalExpenses);
}

function getFilteredTransactions() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedType = filterType.value;
  const selectedCategory = filterCategory.value;

  return transactions
    .filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm);

      const matchesType =
        selectedType === "all" || item.type === selectedType;

      const matchesCategory =
        selectedCategory === "all" ||
        item.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();
  transactionList.replaceChildren();

  transactionCount.textContent =
    `${filteredTransactions.length} record${filteredTransactions.length === 1 ? "" : "s"}`;

  emptyState.hidden = filteredTransactions.length > 0;

  if (filteredTransactions.length === 0) {
    emptyState.textContent = transactions.length === 0
      ? "No transactions yet. Add your first transaction above!"
      : "No matching transactions. Try changing your search or filters.";
  }

  filteredTransactions.forEach((item) => {
    const row = document.createElement("tr");

    // Transaction description and icon
    const transactionCell = document.createElement("td");
    const transactionName = document.createElement("div");
    transactionName.className = "transaction-name";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.textContent = categoryIcons[item.category] || "📌";

    const nameDetails = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.description;

    const typeText = document.createElement("small");
    typeText.textContent = item.type === "income" ? "Income" : "Expense";

    nameDetails.append(name, typeText);
    transactionName.append(icon, nameDetails);
    transactionCell.append(transactionName);

    // Category
    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = `type-badge ${item.type}`;
    categoryBadge.textContent = item.category;
    categoryCell.append(categoryBadge);

    // Date
    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    // Amount
    const amountCell = document.createElement("td");
    amountCell.className =
      item.type === "income" ? "amount-income" : "amount-expense";

    const sign = item.type === "income" ? "+" : "−";
    amountCell.textContent = `${sign}${formatCurrency(item.amount)}`;

    // Delete button
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete transaction ${item.description}`
    );

    deleteButton.addEventListener("click", () => {
      deleteTransaction(item.id);
    });

    actionCell.append(deleteButton);
    row.append(
      transactionCell,
      categoryCell,
      dateCell,
      amountCell,
      actionCell
    );

    transactionList.append(row);
  });
}

function renderCategoryChart() {
  const categoryTotals = {};

  transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      categoryTotals[item.category] =
        (categoryTotals[item.category] || 0) + item.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  categoryChart.replaceChildren();
  categoryLegend.replaceChildren();

  if (sortedCategories.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-chart";
    empty.textContent = "Add an expense to see your spending breakdown.";
    categoryChart.append(empty);
    return;
  }

  const totalExpenses = sortedCategories.reduce(
    (total, entry) => total + entry[1],
    0
  );

  sortedCategories.forEach(([category, amount]) => {
    const color = categoryColors[category] || "#9b9bad";
    const percentage = totalExpenses > 0
      ? (amount / totalExpenses) * 100
      : 0;

    const row = document.createElement("div");
    row.className = "category-row";

    const info = document.createElement("div");
    info.className = "category-info";

    const name = document.createElement("span");
    name.className = "category-name";

    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.backgroundColor = color;

    const nameText = document.createElement("span");
    nameText.textContent = category;

    name.append(dot, nameText);

    const value = document.createElement("span");
    value.className = "category-value";
    value.textContent = `${formatCurrency(amount)} · ${percentage.toFixed(1)}%`;

    info.append(name, value);

    const track = document.createElement("div");
    track.className = "progress-track";

    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = `${percentage}%`;
    fill.style.backgroundColor = color;

    track.append(fill);
    row.append(info, track);
    categoryChart.append(row);

    const legendItem = document.createElement("span");
    legendItem.className = "legend-item";

    const legendDot = document.createElement("span");
    legendDot.className = "category-dot";
    legendDot.style.backgroundColor = color;

    const legendText = document.createElement("span");
    legendText.textContent = category;

    legendItem.append(legendDot, legendText);
    categoryLegend.append(legendItem);
  });
}

function renderDashboard() {
  updateSummary();
  renderTransactions();
  renderCategoryChart();
}

function deleteTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  const confirmed = window.confirm(
    `Delete "${transaction.description}"?`
  );

  if (!confirmed) {
    return;
  }

  const previousTransactions = transactions;
  transactions = transactions.filter((item) => item.id !== id);

  if (!saveTransactions()) {
    transactions = previousTransactions;
    return;
  }

  renderDashboard();
  showMessage("Transaction deleted successfully.");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description) {
    showMessage("Please enter a description.", true);
    descriptionInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000) {
    showMessage("Enter an amount greater than ₹0 and within the allowed limit.", true);
    amountInput.focus();
    return;
  }

  if (!["income", "expense"].includes(type)) {
    showMessage("Please select a valid transaction type.", true);
    return;
  }

  if (!Object.hasOwn(categoryColors, category)) {
    showMessage("Please select a valid category.", true);
    return;
  }

  if (!date || date > getLocalDate()) {
    showMessage("Please choose a valid date that is not in the future.", true);
    dateInput.focus();
    return;
  }

  const newTransaction = {
    id: createId(),
    description,
    amount: Math.round(amount * 100) / 100,
    type,
    category,
    date
  };

  transactions.unshift(newTransaction);

  if (!saveTransactions()) {
    transactions.shift();
    return;
  }

  form.reset();
  dateInput.value = getLocalDate();
  typeInput.value = "expense";
  categoryInput.value = "Food";

  renderDashboard();
  showMessage("Transaction added successfully!");
  descriptionInput.focus();
});

searchInput.addEventListener("input", renderTransactions);
filterType.addEventListener("change", renderTransactions);
filterCategory.addEventListener("change", renderTransactions);

renderDashboard();