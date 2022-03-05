// Constants
const EMPTY_STRING = '';
const PLUS = '+'
const MINUS = '-';
const DIVISION = '/';
const MULTIPLICATION = '*';
const PERIOD = '.';
const LEFT_BRACKET = '(';
const RIGHT_BRACKET = ')';
const BACKSPACE = '←';
const CLEAR = '∁';
const EQUATION = '=';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const OPERATORS = [PLUS, MINUS, MULTIPLICATION, DIVISION];

// Helper functions
const peek = (stack) => stack[stack.length - 1];

const isANumber = (record) => /\d+\.\d+|\d+/.test(record);

export default class Calculator {
  #mathExpressionString;
  #calculatorHtmlElem
  #calculatorOutputHtmlElem
  #numberStack;
  #operationStack;
  #buttons;

  #appendCharToMathExpression(number) {
    this.#mathExpressionString += number
    this.#calculatorOutputHtmlElem.textContent = this.#mathExpressionString;
  }

  #deleteLastCharFromMathExpression = () => {
    this.#calculatorOutputHtmlElem.textContent = this.#mathExpressionString = this.#mathExpressionString.slice(0, -1);
  }

  #updateMathExpression(expression) {
    this.#calculatorOutputHtmlElem.textContent = this.#mathExpressionString = expression;
  }

  #prevCharacter() {
    return this.#mathExpressionString[this.#mathExpressionString.length - 1] || '';
  }

  #handleClickGeneral = (btn) => {
    if (btn.possiblePrevValues.includes(this.#prevCharacter())) {
      this.#appendCharToMathExpression(btn.value);
    }
    else {
      console.log("ERROR")
    }
  }

  #executeLastOperation = () => {
    const secondOperand = Number(this.#numberStack.pop()); // Второй операнд - число
    const firstOperand = Number(this.#numberStack.pop()); // Первый операнд - число
    const operationSymbol = this.#operationStack.pop(); // Последняя операция -+*/
    const mathFunc = this.#buttons.get(operationSymbol).mathFunction // Получаем нужную функцию по символу
    const result = mathFunc(firstOperand, secondOperand); // Вычисление и сохранение результата
    this.#numberStack.push(result); // Добавляем вычисленное значение обратно в стек чисел
  }

  #executeAllOperationsInStack = () => {
    while (this.#operationStack.length > 0) {
      this.#executeLastOperation();
    }
  }

  log = () => {
    console.log("Operation stack", this.#operationStack);
    console.log("DIgig stack", this.#numberStack);
  }

  #executeOperationsInStackUntilLeftBracket = () => {
    let prevOperation = peek(this.#operationStack); // Достаем операцию до скобки

    while (prevOperation !== LEFT_BRACKET) { // Пока предыдущая операция не левая скобка
      this.#executeLastOperation();
      prevOperation = peek(this.#operationStack);
    }
    this.#operationStack.pop(); // Удаляем левую скобку
  }

  #handleOperationRecord = (btn) => {
    if (this.#operationStack.length === 0) {
      this.#operationStack.push(btn.value);
      return
    }
    let prevOperation = this.#buttons.get(peek(this.#operationStack));

    while (prevOperation && btn.level <= prevOperation.level) {
      const secondOperand = this.#numberStack.pop();
      const firstOperand = this.#numberStack.pop();

      const result = prevOperation.mathFunction(Number(firstOperand), Number(secondOperand));

      this.#numberStack.push(result);
      this.#operationStack.pop();
      prevOperation = this.#buttons.get(peek(this.#operationStack));
    }
    this.#operationStack.push(btn.value);
  }

  constructor() {
    this.#mathExpressionString = EMPTY_STRING;
    this.#calculatorHtmlElem = document.querySelector('.calculator');
    this.#calculatorOutputHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-input");
    this.#operationStack = [];
    this.#numberStack = [];


    this.#calculatorHtmlElem.addEventListener('click', (e) => {
      const clickedBtn = this.#buttons.get(e.target.dataset.content);
      if (clickedBtn) clickedBtn.handleClick(clickedBtn);
    });


    this.#buttons = new Map(Object.entries({
        [CLEAR]: {
          handleClick: this.#updateMathExpression.bind(this, EMPTY_STRING),
        },
        [BACKSPACE]: {
          handleClick: this.#deleteLastCharFromMathExpression,
        },
        [LEFT_BRACKET]: {
          value: LEFT_BRACKET,
          possiblePrevValues: [EMPTY_STRING, ...OPERATORS, LEFT_BRACKET],
          level: 0,
          handleClick: this.#handleClickGeneral,
          handleExecution: () => this.#operationStack.push(LEFT_BRACKET)
        },
        [RIGHT_BRACKET]: {
          value: RIGHT_BRACKET,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          handleClick: this.#handleClickGeneral,
          handleExecution: this.#executeOperationsInStackUntilLeftBracket,
        },
        [PERIOD]: {
          value: PERIOD,
          possiblePrevValues: [...DIGITS],
          handleClick: (char) => {
            // Если последнее число уже содержит точку (.)
            if (/\d+\.\d+$/g.test(this.#mathExpressionString)) console.error("Error");
            else this.#handleClickGeneral.call(this, char);
          }
        },
        [PLUS]: {
          value: PLUS,
          level: 1,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          handleClick: this.#handleClickGeneral,
          mathFunction: (a, b) => {
            console.log(`Math operation ${a} + ${b};`)
            return a + b;
          },
          handleExecution: this.#handleOperationRecord,
        },
        [MINUS]: {
          value: MINUS,
          level: 1,
          handleClick: this.#handleClickGeneral,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          mathFunction: (a, b) => {
            console.log(`Math operation ${a} - ${b};`)
            return a - b;
          },
          handleExecution: this.#handleOperationRecord,
        },
        [MULTIPLICATION]: {
          value: MULTIPLICATION,
          level: 2,
          handleClick: this.#handleClickGeneral,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          mathFunction: (a, b) => {
            console.log(`Math operation ${a} * ${b};`)
            return a * b;
          },
          handleExecution: this.#handleOperationRecord,
        },
        [DIVISION]: {
          value: DIVISION,
          level: 2,
          handleClick: this.#handleClickGeneral,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          mathFunction: (a, b) => {
            console.log(`Math operation ${a} / ${b};`)
            return a / b;
          },
          handleExecution: this.#handleOperationRecord,
        },
        [EQUATION]: {
          handleClick: () => {
            // const mockExpression = '2.2-1.1'
            // const mathRecord = mockExpression.match(/[()+-/*//]|\d+\.\d+|\d+/g);
            const mathRecord = this.#mathExpressionString.match(/[()+-/*//]|\d+\.\d+|\d+/g);

            for (const record of mathRecord) {
              if (isANumber(record)) { // Если число добавляем в стек чисел
                this.#numberStack.push(record);
              }
              else { // Иначе значит операция, выполнить операцию
                const btn = this.#buttons.get(record);
                btn.handleExecution(btn);
              }
            }
            this.#executeAllOperationsInStack(); // Выполнить все оставшиеся операции

            alert(this.#numberStack.pop()) // В стеке останется одно число = ответ
          }
        },
      }
    ));

    DIGITS.forEach(digit => this.#buttons.set(digit, {
      value: digit,
      possiblePrevValues: [EMPTY_STRING, ...DIGITS, ...OPERATORS, PERIOD, LEFT_BRACKET],
      handleClick: this.#handleClickGeneral,
    }));
  }
}