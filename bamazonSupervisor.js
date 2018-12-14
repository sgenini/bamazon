var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table = new Table({
    head: ['Department ID', 'Department Name', 'Overhead Costs ($)', 'Department Sales ($)', 'Total Profit ($)']
});

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazonDB"
});

connection.connect(function(err) {
    if(err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    mainMenu();
});

function mainMenu() {
    inquirer.prompt([
        {
            name: "action",
            type: "list",
            message: "Main Menu",
            choices: ["View Product Sales by Department", "Create New Department"]
        }
    ]).then(function(answer){
        switch (answer.action) {
        case "View Product Sales by Department":
            viewSales();
            break;
        
        case "Create New Department":
            addDepartment();
            break;
        }
    })
}

function reRun() {
    inquirer.prompt([
        {
            name: "nextStep",
            type: "list",
            message: "What would you like to do?",
            choices: ["Return to home", "Exit program"]
        }
    ]).then(function(answer){
        if (answer.nextStep === "Return to home"){
            mainMenu();
        }
        else {
            process.exit();
        }
    })
}

function viewSales(){
    console.log("\nProduct Sales by Department:")
    connection.query("SELECT *, SUM(product_sales) AS department_sales FROM departments INNER JOIN products ON departments.department_name = products.department_name GROUP BY products.department_name ORDER BY departments.department_id", function(err,res){
        if(err) throw err;
        table.length = 0;
        for (var i = 0; i < res.length; i++){
            table.push([res[i].department_id, res[i].department_name, res[i].over_head_costs.toFixed(2), res[i].department_sales.toFixed(2), (res[i].department_sales - res[i].over_head_costs).toFixed(2)]);
        }
        console.log(table.toString() + "\n");
        reRun();
    });
}

function addDepartment() {
    inquirer.prompt([
        {
            name: "departmentName",
            type: "input",
            message: "Department Name: "
        },
        {
            name: "overheadCost",
            type: "input",
            message: "Overhead Cost: ",
            validate: function(value) {
                if (isNaN(value) === false && value > 0) {
                  return true;
                }
                console.log("\nPlease enter a number greater than 0");
                return false;
            }
        }
    ]).then(function(answer){
        connection.query("INSERT INTO departments SET ?",
        {
            department_name: answer.departmentName,
            over_head_costs: answer.overheadCost
        }
        );
        console.log("Department successfully added.");
        reRun();
    })
}