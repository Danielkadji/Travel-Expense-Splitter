let expenses = [];




function addExpense() {
    let flag = 1;

    

    //Replace category "Other" by new category the user inputed
    var newcat = document.getElementById("newCategory").value;
    document.getElementById("selectOther").value = newcat;

    flag = checkInput(flag);
    if(flag == 1){      

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

    myFunction(name)
    
    clearInput();
    
}

}



function updateExpensesList() {
    const listDiv = document.getElementById("table");

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
    listDiv.innerHTML =  tableHtml;

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


//New function to prevent user from typing negative number
var RegExp = new RegExp(/^\d*\.?\d*$/);
var val = document.getElementById("amount").value;

function valid(elem) {
    if (RegExp.test(elem.value)) {
        val = elem.value;
    } else {
        elem.value = val;
    }
}



//Enable new input box when selecting "Other" category
function enableNewCategory(category){
    if(category.selectedIndex == 4)
    {
       document.getElementById("newCategory").classList.remove("cat-none"); 
    }else{
       document.getElementById("newCategory").classList.add("cat-none");
    }
}


//Clear all input boxes after clicking on äddExpenses button
function clearInput()
{
    var allInputs = document.querySelectorAll('input');
    allInputs.forEach(singleInput => singleInput.value = '');
    document.getElementById("newCategory").classList.add("cat-none");
    document.getElementById("selectOther").value = "Other";
    document.getElementById("category").selectedIndex = "0";

}

//check the user input a name, amount, and select a category 
function checkInput(flag)
{
    var x_name = document.getElementById("name").value;
    var y_category = document.getElementById("category");
    var z_amount = document.getElementById("amount").value;
    
    if(x_name == "")
    {
        document.getElementById("alertName").innerHTML = "Please enter a name";
        flag = 0;
    }else{
        document.getElementById("alertName").innerHTML = "";     
    }
    if(y_category.selectedIndex == 0)
    {
        document.getElementById("alertCategory").innerHTML = "Please select a category";
        flag = 0;
    }else{
        document.getElementById("alertCategory").innerHTML = "";      
    }
    if(z_amount == "")
    {
        document.getElementById("alertAmount").innerHTML = "Please enter the amount";
        flag = 0;
    }else{
        document.getElementById("alertAmount").innerHTML = "";
    }
      
    return flag;
}

function myFunction(name) {
    var x = document.getElementById("addOption");
    var option = document.createElement("option");
    option.text = name;
        x.add(option, x[0]);
  }

    
  function setName(){
    var e = document.getElementById("addOption");
    
    document.getElementById("name").value = e.options[e.selectedIndex].text;
    
  }