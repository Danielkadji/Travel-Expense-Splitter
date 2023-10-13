let expenses = [];

function addExpense() {
    const name = document.getElementById("name").value;
    const category = document.getElementById("category").value;
    const amount = parseFloat(document.getElementById("amount").value);

    // Check if the name already exists in the expenses list
    let existingExpense = expenses.find(expense => expense.name === name);

    if (existingExpense) {
        existingExpense.total += amount;
        existingExpense.categories[category] = (existingExpense.categories[category] || 0) + amount;
    } else {
        expenses.push({
            name: name,
            categories: {
                [category]: amount
            },
            total: amount
        });
    }

    updateExpensesList();
}



function updateExpensesList() {
    const listDiv = document.getElementById("expensesList");
    // Get a list of all unique categories
    const allCategories = [...new Set(expenses.flatMap(expense => Object.keys(expense.categories)))];

    // Create header row
    let tableHtml = "<table><thead><tr>";
    tableHtml += "<th>Name</th>";
    allCategories.forEach(category => {
        tableHtml += `<th>${category}</th>`;
    });
    tableHtml += "<th>Total Expenses</th></tr></thead><tbody>";

    // Create rows for each person
    expenses.forEach(expense => {
        tableHtml += `<tr><td>${expense.name}</td>`;
        allCategories.forEach(category => {
            let categoryAmount = expense.categories[category] || 0;
            tableHtml += `<td>$${categoryAmount.toFixed(2)}</td>`;
        });
        tableHtml += `<td>$${expense.total.toFixed(2)}</td></tr>`;
    });

    tableHtml += "</tbody></table>";
    listDiv.innerHTML = tableHtml;
}



function calculateDebts() {
    const totalExpense = expenses.reduce((acc, expense) => acc + expense.total, 0);
    const perPerson = totalExpense / expenses.length;

    let debts = [];
    expenses.forEach(expense => {
        const owes = perPerson - expense.total;
        debts.push({
            name: expense.name,
            owes: owes
        });
    });

    let resultHtml = `<h2>Total Amount Spent: $${totalExpense.toFixed(2)}</h2>`;
    resultHtml += "<h3>Debts:</h3><table><thead><tr><th>Debtor</th><th>Creditor</th><th>Amount</th></tr></thead><tbody>";

    // For each debtor, find a creditor and settle the debt.
    debts.forEach(debtor => {
        if (debtor.owes > 0) {
            debts.forEach(creditor => {
                if (creditor.owes < 0 && debtor.owes > 0) {
                    let amountToSettle = Math.min(debtor.owes, -creditor.owes);
                    resultHtml += `<tr><td>${debtor.name}</td><td>${creditor.name}</td><td>$${amountToSettle.toFixed(2)}</td></tr>`;
                    debtor.owes -= amountToSettle;
                    creditor.owes += amountToSettle;
                }
            });
        }
    });

    resultHtml += "</tbody></table>";
    document.getElementById("debts").innerHTML = resultHtml;
}
