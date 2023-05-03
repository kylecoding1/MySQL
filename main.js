const inquirer = require('inquirer');
const connection = require('./config');

function mainMenu() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit'
        ]
      }
    ])
    .then((answers) => {
      switch (answers.choice) {
        case 'View all departments':
          viewDepartments();
          break;
        case 'View all roles':
          viewRoles();
          break;
        case 'View all employees':
          viewEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Exit':
        default:
          connection.end();
          break;
      }
    });
}

function viewDepartments() {
  connection.query('SELECT * FROM departments', (err, results) => {
    if (err) throw err;
    console.table(results);
    mainMenu();
  });
}

function viewRoles() {
  connection.query(
    `SELECT roles.id, roles.title, roles.salary, departments.name AS department
    FROM roles
    JOIN departments ON roles.department_id = departments.id`,
    (err, results) => {
      if (err) throw err;
      console.table(results);
      mainMenu();
    }
  );
}

function viewEmployees() {
  connection.query(
    `SELECT e1.id, e1.first_name, e1.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(e2.first_name, ' ', e2.last_name) AS manager
    FROM employees e1
    LEFT JOIN employees e2 ON e1.manager_id = e2.id
    INNER JOIN roles ON e1.role_id = roles.id
    INNER JOIN departments ON roles.department_id = departments.id`,
    (err, results) => {
      if (err) throw err;
      console.table(results);
      mainMenu();
    }
  );
}

function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'departmentName',
        message: 'Enter the name of the department:',
      },
    ])
    .then((answers) => {
      connection.query(
        'INSERT INTO departments SET ?',
        {
          name: answers.departmentName,
        },
        (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} department added!\n`);
          mainMenu();
        }
      );
    });
}

function addRole() {
  connection.query('SELECT * FROM departments', (err, departments) => {
    if (err) throw err;

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'roleTitle',
          message: 'Enter the title of the role:',
        },
        {
          type: 'input',
          name: 'roleSalary',
          message: 'Enter the salary for the role:',
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department for the role:',
          choices: departments.map((department) => ({
            name: department.name,
            value: department.id,
          })),
        },
      ])
      .then((answers) => {
        connection.query(
          'INSERT INTO roles SET ?',
          {
            title: answers.roleTitle,
            salary: answers.roleSalary,
            department_id: answers.departmentId,
          },
          (err, res) => {
            if (err) throw err;
            console.log(`${res.affectedRows} role added!\n`);
            mainMenu();
          }
        );
      });
  });
}

function addEmployee() {
  connection.query('SELECT * FROM roles', (err, roles) => {
    if (err) throw err;

    connection.query('SELECT * FROM employees', (err, employees) => {
      if (err) throw err;

      inquirer
        .prompt([
          {
            type: 'input',
            name: 'firstName',
            message: 'Enter the employee\'s first name:',
          },
          {
            type: 'input',
            name: 'lastName',
            message: 'Enter the employee\'s last name:',
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the employee\'s role:',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
          {
            type: 'list',
            name: 'managerId',
            message: 'Select the employee\'s manager:',
            choices: [
              { name: 'None', value: null },
              ...employees.map((employee) => ({
                name: `${employee.first_name} ${employee.last_name}`,
                value: employee.id,
              })),
            ],
          },
        ])
        .then((answers) => {
          connection.query(
            'INSERT INTO employees SET ?',
            {
              first_name: answers.firstName,
              last_name: answers.lastName,
              role_id: answers.roleId,
              manager_id: answers.managerId,
            },
            (err, res) => {
              if (err) throw err;
              console.log(`${res.affectedRows} employee added!\n`);
              mainMenu();
            }
          );
        });
    });
  });
}

function updateEmployeeRole() {
  connection.query('SELECT * FROM employees', (err, employees) => {
    if (err) throw err;

    connection.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee to update:',
            choices: employees.map((employee) => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id,
            })),
          },
          {
            type: 'list',
            name: 'newRoleId',
            message: 'Select the new role for the employee:',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ])
        .then((answers) => {
          connection.query(
            'UPDATE employees SET ? WHERE ?',
            [
              {
                role_id: answers.newRoleId,
              },
              {
                id: answers.employeeId,
              },
            ],
            (err, res) => {
              if (err) throw err;
              console.log(`${res.affectedRows} employee role updated!\n`);
              mainMenu();
            }
          );
        });
    });
  });
}

// Connect to the database and start the main menu
connection.connect((err) => {
  if (err) throw err;
  console.log(`Connected as id ${connection.threadId}\n`);
  mainMenu();
});


