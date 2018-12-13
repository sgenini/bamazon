var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table = new Table({
    head: ['Item ID', 'Name of Product', 'Department', 'Price per Unit ($)', 'Quantity in Stock']
    // , colWidths: [100, 500, 500, 200, 100]
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
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
        }
    ]).then(function(answer){
        switch (answer.action) {
        case "View Products for Sale":
            viewProducts();
            break;
        
        case "View Low Inventory":
            viewLowInventory();
            break;

        case "Add to Inventory":
            addInventory();
            break;

        case "Add New Product":
            addProduct();
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

function viewProducts(){
    console.log("\nItems available for sale:")
    connection.query("SELECT * FROM products", function(err,res){
        if(err) throw err;
        table.length = 0;
        for (var i = 0; i < res.length; i++){
            table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price.toFixed(2), res[i].stock_quantity]);
        }
        console.log(table.toString() + "\n");
        reRun();
    });
}

function viewLowInventory(){
    console.log("\nItems with low quantities:")
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function(err,res){
        if(err) throw err;
        table.length = 0;
        for (var i = 0; i < res.length; i++){
            table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price.toFixed(2), res[i].stock_quantity]);
        }
        console.log(table.toString() + "\n");
        reRun();
    });
}


function addInventory() {
    console.log("\nCurrent Inventory:")
    connection.query("SELECT * FROM products", function(err,res){
        if(err) throw err;
        table.length = 0;
        for (var i = 0; i < res.length; i++){
            table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price.toFixed(2), res[i].stock_quantity]);
        }
        console.log(table.toString() + "\n");
    inquirer
        .prompt([
            {
                name: "itemID",
                type: "input",
                message: "Enter the Item ID of the product you'd like to add:",
                validate: function(value) {
                    if (isNaN(value) === false) {
                      return true;
                    }
                    console.log("\nPlease enter a number");
                    return false;
                }
            },
            {
                name: "quantity",
                type: "input",
                message: "How many units would you like to add?",
                validate: function(value) {
                    if (isNaN(value) === false && value > 0) {
                      return true;
                    }
                    console.log("\nPlease enter a number greater than 0");
                    return false;
                }
            }]
        )
        .then(function(answer) {
            connection.query("SELECT * FROM products WHERE ?", { item_id: answer.itemID }, function(err, res){
                connection.query("UPDATE products SET ? WHERE ?", [
                    { stock_quantity: res[0].stock_quantity -= -answer.quantity },
                    { item_id: answer.itemID }], function(err, res){
                        console.log("Stock quantities updated!");
                        reRun();
                });
            })
        })
    });
}

function addProduct() {
    inquirer.prompt([
        {
            name: "productName",
            type: "input",
            message: "Product Name: "
        },
        {
            name: "productDepartment",
            type: "input",
            message: "Department: "
        },
        {
            name: "productPrice",
            type: "input",
            message: "Price per Unit: ",
            validate: function(value) {
                if (isNaN(value) === false && value > 0) {
                  return true;
                }
                console.log("\nPlease enter a number greater than 0");
                return false;
            }
        },
        {
            name: "productQuantity",
            type: "input",
            message: "Quantity to Add: ",
            validate: function(value) {
                if (isNaN(value) === false && value > 0) {
                  return true;
                }
                console.log("\nPlease enter a number greater than 0");
                return false;
            }
        }
    ]).then(function(answer){
        connection.query("INSERT INTO products SET ?",
        {
            product_name: answer.productName,
            department_name: answer.productDepartment,
            price: answer.productPrice,
            stock_quantity: answer.productQuantity
        }
        );
        console.log("Product successfully added.");
        reRun();
    })
}