var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table = new Table({
    head: ['Item ID', 'Name of Product', 'Department', 'Price per Unit ($)', 'Quantity in Stock', 'Product Sales']
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
    start();
});

function start(){
    console.log("\nItems available for sale:")
    connection.query("SELECT * FROM products", function(err,res){
        if(err) throw err;
        table.length = 0;
        for (var i = 0; i < res.length; i++){
            table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price.toFixed(2), res[i].stock_quantity, res[i].product_sales]);
        }
        console.log(table.toString());
        prompt();
    });
}

function prompt() {
    inquirer
        .prompt([
            {
                name: "itemID",
                type: "input",
                message: "Enter the Item ID of the product you'd like to purchase:",
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
                message: "How many units would you like to purchase?",
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
                if (answer.quantity > res[0].stock_quantity){
                    console.log("Sorry - we were unable to process your request due to insufficient quantity.")
                    prompt();
                }
                else {
                    console.log("Transaction Complete! Your total comes out to $" + (res[0].price * answer.quantity).toFixed(2));
                    connection.query("UPDATE products SET ? WHERE ?", [
                        { stock_quantity: res[0].stock_quantity -= answer.quantity,
                            product_sales: res[0].product_sales += (res[0].price * answer.quantity) },
                        { item_id: answer.itemID }], function(err, res){
                            console.log("Stock quantities updated!");
                            reRun();
                    });
                }
            })
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
            start();
        }
        else {
            process.exit();
        }
    })
}