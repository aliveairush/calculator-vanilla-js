import {
  BACKSPACE,
  CLEAR,
  DIGITS,
  DIVISION,
  EMPTY_STRING,
  EQUATION,
  LEFT_BRACKET,
  MINUS,
  MULTIPLICATION,
  OPERATORS,
  PERIOD,
  PLUS,
  RIGHT_BRACKET
} from "./constants.mjs";

import {doesLastNumberContainPeriod, isANumber, isEmpty, peek, splitOnMathChunks} from "./utils.mjs";


export default class Calculator {
  #calculatorHtmlElem
  #inputTextHtmlElem
  #outputTextHtmlElem

  #inputString;
  #numberStack;
  #operationStack;
  #calcButtons;

  constructor(container) {
    if (!container) {
      throw new Error("Container cannot be null or undefined")
    }

    this.#calculatorHtmlElem = this.#renderCalcHtml(container); // Render calculator html

    this.#inputString = DIGITS[0]; // Input string value by default is '0'
    this.#inputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-input"); // DOM element where clicked button's values are displayed
    this.#outputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-output"); // DOM element where math expression result is displayed
    this.#operationStack = []; // Stack of operations such as "=-*/(
    this.#numberStack = []; // Or in other words Operator stack

    // Map initialization of the calculator button objects
    this.#calcButtons = this.#calcButtonInitialization();

    // Event listener on calc itself to catch button click using event bubbling
    this.#calculatorHtmlElem.addEventListener('click', (e) => {
      try {
        const clickedBtn = this.#calcButtons.get(e.target.dataset.content); // Getting btn object by clicked character
        if (clickedBtn) { // If data-content != null that means clicked object is a btn
          clickedBtn.handleClick(clickedBtn); // Handle button click
        }
      } catch (error) {
        console.warn(error.message);
      }
    });
  }

  /** Every calculator button object at least has handleClick() function, which is being executed when user clicks on corresponded calculator button
   Other optional properties:
   - value: character of the button
   - possiblePrevValues: this property helps to check if the current button value is allowed to be put in.
   - level: priority of operation for example if we write 2+2*2 we have to execute multiplication first, that means multiplication should have higher priority
   - mathFunction(): Only operation objects (/*+-) have this function.
   - handleExecution(): Only operation objects and parentheses have this function. This func determines how operation should be executed
   */
  #calcButtonInitialization = () => {
    const map = new Map(Object.entries({
        [CLEAR]: {
          handleClick: this.#updateMathExpression.bind(this, DIGITS[0]), // On "clear" button click input field value should be set as default value (0)
        },
        [BACKSPACE]: {
          handleClick: this.#deleteLastCharFromMathExpression, // Removing last character from input field
        },
        [LEFT_BRACKET]: {
          value: LEFT_BRACKET,
          possiblePrevValues: [EMPTY_STRING, ...OPERATORS, LEFT_BRACKET],
          level: 0, // Lowest priority
          handleClick: () => {
            // If the input field contains only the one character, and it is 0, then we should clear 0 from the input field
            if (this.#inputString === DIGITS[0]) {
              this.#inputString = EMPTY_STRING;
            }
            // Execute the standard button click using call method
            this.#handleBtnClick.call(this, this.#calcButtons.get(LEFT_BRACKET));
          },
          handleExecution: () => this.#operationStack.push(LEFT_BRACKET), // Left bracket is special, we need to put it in the operation stack
        },
        [RIGHT_BRACKET]: {
          value: RIGHT_BRACKET,
          possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
          handleClick: this.#handleBtnClick,
          handleExecution: this.#executeOperationsInStackUntilLeftBracket,
        },
        [PERIOD]: {
          value: PERIOD,
          possiblePrevValues: [...DIGITS],
          handleClick: () => {
            // Number should not have 2 dots
            if (doesLastNumberContainPeriod(this.#inputString)) {
              throw new Error("There cannot be 2 dots in one number");
            }
            this.#handleBtnClick.call(this, this.#calcButtons.get(PERIOD));
          }
        },
        [PLUS]: this.#btnOperationObject({
          value: PLUS,
          level: 1,
          mathFunction: (a, b) => a + b
        }),
        [MINUS]: this.#btnOperationObject({
          value: MINUS,
          level: 1,
          mathFunction: (a, b) => a - b,
        }),
        [MULTIPLICATION]: this.#btnOperationObject({
          value: MULTIPLICATION,
          level: 2,
          mathFunction: (a, b) => a * b,
        }),
        [DIVISION]: this.#btnOperationObject({
          value: DIVISION,
          level: 2,
          mathFunction: (a, b) => a / b,
        }),

        [EQUATION]: {
          handleClick: () => {
            try {

              const mathChunks = splitOnMathChunks(this.#inputString); // Math chunks looks like ["2.2", "-", "4", "*", "2"]

              for (const chunk of mathChunks) {
                if (isANumber(chunk)) { // If math chunk is a number, then put it in on top of numbers stack
                  this.#numberStack.push(chunk);
                }
                // Otherwise, chunk must be an operation, so get it's btn object and call handleExecution() function
                else {
                  const btn = this.#calcButtons.get(chunk);
                  btn.handleExecution(btn);
                }
              }

              this.#executeAllOperationsInStack(); // Execute all left operations in operation stack

              const finalResult = this.#numberStack.pop(); // After operations execution, number stack should have only one item in it and it is the answer

              this.#displayMathResult(finalResult); // Display answer into output html element
              this.#updateMathExpression(finalResult); // Set new value input field value as the previous expression result
            } catch (error) {
              this.#displayMathResult('ERROR');
            }
          }
        },
      }
    ));

    DIGITS.forEach(digit => map.set(digit, {
      value: digit,
      possiblePrevValues: [EMPTY_STRING, ...DIGITS, ...OPERATORS, PERIOD, LEFT_BRACKET],
      handleClick: () => {
        // If input field value contains only 0, then on digit btn click it is better to get rid of 0
        if (this.#inputString === DIGITS[0]) {
          this.#inputString = EMPTY_STRING;
        }
        this.#handleBtnClick(this.#calcButtons.get(digit));
      },
    }));

    return map;
  }

  // Function updates input field text content and inner string variable with given string
  #updateMathExpression(expression) {
    this.#inputTextHtmlElem.textContent = this.#inputString = expression;
  }

  #deleteLastCharFromMathExpression = () => {
    // If input field has only 1 symbol then set input field value by default as 0
    if (this.#inputString.length === 1) {
      this.#updateMathExpression(DIGITS[0]);
    }
    // Else just shorten input field value by 1 symbol
    else {
      this.#updateMathExpression(this.#inputString.slice(0, -1));
    }
  }

  #prevCharacter = () => this.#inputString[this.#inputString.length - 1] || EMPTY_STRING;

  #handleBtnClick = (btn) => {
    const previousChar = this.#prevCharacter();
    // If current symbol is not allowed after previous symbol (e.g. * cant go after +), then throw an Error
    if (!btn.possiblePrevValues.includes(previousChar)) {
      throw new Error(`${btn.value} cant be used after ${previousChar}`);
    }
    this.#updateMathExpression(this.#inputString + btn.value);
  }

  #executeLastOperation = () => {
    const secondOperand = Number(this.#numberStack.pop());
    const firstOperand = Number(this.#numberStack.pop());
    const operationSymbol = this.#operationStack.pop();

    const mathFunc = this.#calcButtons.get(operationSymbol).mathFunction // Get needed math function by operation symbol
    const result = mathFunc(firstOperand, secondOperand); // Execute math function
    this.#numberStack.push(result.toString()); // Put math result variable on top of the number stack
  }

  #executeAllOperationsInStack = () => {
    while (this.#operationStack.length > 0) {
      this.#executeLastOperation();
    }
  }

  #executeOperationsInStackUntilLeftBracket = () => {
    let prevOperation = peek(this.#operationStack);  // Peeking last operation symbol from operation stack

    while (prevOperation !== LEFT_BRACKET) { // While last operation symbol is not left bracket execute last operation
      this.#executeLastOperation();
      prevOperation = peek(this.#operationStack);
    }
    this.#operationStack.pop(); // Removing Left bracket from operation stack
  }

  /**
   * Function for operations such as ()/*-+
   */
  #handleExecution = (operationBtn) => {
    const operationStack = this.#operationStack;
    // If operation stack is empty, then just add operation on top and exit the function
    if (isEmpty(operationStack)) {
      operationStack.push(operationBtn.value);
      return
    }

    // Peeking last operation object from operation stack
    let prevBtn = this.#calcButtons.get(peek(operationStack));

    // While there is an operation in operation stack and while current operation priority is lower or equal to previous btn object
    while (prevBtn && operationBtn.level <= prevBtn.level) {
      this.#executeLastOperation();
      prevBtn = this.#calcButtons.get(peek(this.#operationStack)); // After the last operation executed take new last operation
    }
    this.#operationStack.push(operationBtn.value); // Put current operation object on top of operation stack
  }

  /**
   * Function displays math result in output dom element
   */
  #displayMathResult = (result) => {
    this.#outputTextHtmlElem.insertAdjacentHTML("beforeend", `<span>${this.#inputString} = <strong>${result}</strong></span>`);

    const calcHeaderHtml = this.#calculatorHtmlElem.querySelector('.calc__header');
    calcHeaderHtml.scrollTop = this.#outputTextHtmlElem.scrollHeight;
  }

  /**
   * Function to create operation button objects
   * All operation have one 3 properties in common: possiblePrevValues, handleClick(), handleExecution()
   * And operation can have different value, level and math function itself.
   */
  #btnOperationObject = ({value, level, mathFunction}) => {
    return {
      value,
      level,
      possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
      handleClick: this.#handleBtnClick,
      mathFunction,
      handleExecution: this.#handleExecution,
    }
  }

  // Simple rendering calculator html in container dom element.
  #renderCalcHtml = (container) => {
    const calc = document.createElement('div');
    calc.className = 'calculator';

    calc.innerHTML = `
  <div class="calc__header">
    <div class="calc__item-output"></div>
    <div class="calc__item-input">0</div>
  </div>
  <div class="calc__item calc__item_yellow" data-content="&comp;"></div>
  <div class="calc__item calc__item_yellow" data-content="&larr;"></div>
  <div class="calc__item calc__item_grey" data-content="("></div>
  <div class="calc__item calc__item_grey" data-content=")"></div>
  <div class="calc__item " data-content="+"></div>
  <div class="calc__item calc__item_dark" data-content="7"></div>
  <div class="calc__item calc__item_dark" data-content="8"></div>
  <div class="calc__item calc__item_dark" data-content="9"></div>
  <div class="calc__item " data-content="-"></div>
  <div class="calc__item calc__item_dark" data-content="4"></div>
  <div class="calc__item calc__item_dark" data-content="5"></div>
  <div class="calc__item calc__item_dark" data-content="6"></div>
  <div class="calc__item " data-content="*"></div>
  <div class="calc__item calc__item_dark" data-content="1"></div>
  <div class="calc__item calc__item_dark" data-content="2"></div>
  <div class="calc__item calc__item_dark" data-content="3"></div>
  <div class="calc__item " data-content="/"></div>
  <div class="calc__item " data-content="."></div>
  <div class="calc__item calc__item_dark" data-content="0"></div>
  <div class="calc__item calc__item_light-blue" data-content="="></div>`;

    container.append(calc);
    return calc;
  }
}