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

// Splitting math expression on math chunks,
// 1) Take if in the beginning is negative numbers with period 2)  Take if in the beginning is negative  numbers 3) Take positive numbers with period 4) Take Positive numbers 5) Take parenthesis and math signs
const splitOnMathChunks = (string) =>  string.match(/^-\d+\.\d+|^-\d+|\d+\.\d+|\d+|[()+-/*//]/g);

export default class Calculator {
  #calculatorHtmlElem
  #inputTextHtmlElem
  #outputTextHtmlElem

  #mathExpressionString;
  #numberStack;
  #operationStack;
  #buttons;

  #appendCharToMathExpression(number) {
    this.#mathExpressionString += number
    this.#inputTextHtmlElem.textContent = this.#mathExpressionString;
  }


  #updateMathExpression(expression) {
    this.#inputTextHtmlElem.textContent = this.#mathExpressionString = expression;
  }

  #deleteLastCharFromMathExpression = () => {
    // Если был введен 1 символ, то после его стирания нужно установить дефолт в 0
    if (this.#mathExpressionString.length === 1) {
      this.#updateMathExpression(DIGITS[0]);
    } else { // Иначе просто передаем новую строку на 1 символ короче
      this.#updateMathExpression(this.#mathExpressionString.slice(0, -1));
    }
  }

  #prevCharacter() {
    return this.#mathExpressionString[this.#mathExpressionString.length - 1] || '';
  }

  #handleBtnClick = (btn) => {
    // Если текущий символ не допустим (например * не может быть после +), то выбрасываем ошибку
    const previousChar = this.#prevCharacter();
    if (!btn.possiblePrevValues.includes(previousChar)){
      throw new Error(`${btn.value} cant be used after ${previousChar}`);
    }

    this.#appendCharToMathExpression(btn.value);
  }

  #executeLastOperation = () => {
    const secondOperand = Number(this.#numberStack.pop()); // Второй операнд - число
    const firstOperand = Number(this.#numberStack.pop()); // Первый операнд - число
    const operationSymbol = this.#operationStack.pop(); // Последняя операция -+*/
    const mathFunc = this.#buttons.get(operationSymbol).mathFunction // Получаем нужную функцию по символу
    const result = mathFunc(firstOperand, secondOperand); // Вычисление и сохранение результата
    this.#numberStack.push(result.toString()); // Добавляем вычисленное значение обратно в стек чисел
  }

  #executeAllOperationsInStack = () => {
    while (this.#operationStack.length > 0) {
      this.#executeLastOperation();
    }
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

  #outputResultOfMathExpression = (result) => {
    // TODO refactor
    this.#outputTextHtmlElem.insertAdjacentHTML("beforeend", `<span>${this.#mathExpressionString} = ${result}</span>`)
    const calcHeaderHtml = this.#calculatorHtmlElem.querySelector('.calc__item-header');
    calcHeaderHtml.scrollTop = this.#outputTextHtmlElem.offsetHeight;
  }

  #btnOperationObject = ({value, level, mathFunction}) => {
    return {
      value,
      level,
      possiblePrevValues: [...DIGITS, RIGHT_BRACKET],
      handleClick: this.#handleBtnClick,
      mathFunction,
      handleExecution: this.#handleOperationRecord,
    }
  }

  constructor() {
    this.#mathExpressionString = DIGITS[0];
    this.#calculatorHtmlElem = document.querySelector('.calculator');
    this.#inputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-input");
    this.#outputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-output");
    this.#operationStack = [];
    this.#numberStack = [];

    // Event listener будет отлавливать все клики по кнопкам
    this.#calculatorHtmlElem.addEventListener('click', (e) => {
      try {
        const clickedBtn = this.#buttons.get(e.target.dataset.content); // если data-content != null значит это кнопка
        if (clickedBtn) clickedBtn.handleClick(clickedBtn); // Выполняем функцию по нажатию на кнопку
      } catch (error){
        console.warn(error.message);
      }
    });


    // Таблица из кнопок и соответствующих им функций по нажатию на кнопку
    this.#buttons = new Map(Object.entries({
        [CLEAR]: {
          handleClick: this.#updateMathExpression.bind(this, DIGITS[0]),
        },
        [BACKSPACE]: {
          handleClick: this.#deleteLastCharFromMathExpression,
        },
        [LEFT_BRACKET]: {
          value: LEFT_BRACKET,
          possiblePrevValues: [EMPTY_STRING, ...OPERATORS, LEFT_BRACKET],
          level: 0,
          handleClick: this.#handleBtnClick,
          handleExecution: () => this.#operationStack.push(LEFT_BRACKET),
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
          handleClick: (char) => {
            // TODO refactor
            // Если последнее число уже содержит точку (.)
            if (/\d+\.\d+$/g.test(this.#mathExpressionString)) console.error("Error");
            else this.#handleBtnClick.call(this, char);
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
          // TODO when have only One digit in expression show warning
          // TODO Make try catch
          handleClick: () => {
            try {
              const mathChunks = splitOnMathChunks(this.#mathExpressionString);

              for (const chunk of mathChunks) {
                if (isANumber(chunk)) { // Если число добавляем в стек чисел
                  this.#numberStack.push(chunk);
                }
                else { // Иначе значит операция, выполнить операцию
                  const btn = this.#buttons.get(chunk);
                  btn.handleExecution(btn);
                }
              }
              this.#executeAllOperationsInStack(); // Выполнить все оставшиеся операции

              const finalResult = this.#numberStack.pop(); // В стеке останется одно число = ответ

              this.#outputResultOfMathExpression(finalResult);
              this.#updateMathExpression(finalResult);
            } catch (error) {
              this.#outputResultOfMathExpression('ERROR');
            }
          }
        },
      }
    ));

    DIGITS.forEach(digit => this.#buttons.set(digit, {
      value: digit,
      possiblePrevValues: [EMPTY_STRING, ...DIGITS, ...OPERATORS, PERIOD, LEFT_BRACKET],
      handleClick: () => {
        // Если в строке только один 0, то мы должны его переписать
        if (this.#mathExpressionString === DIGITS[0]){
          this.#mathExpressionString = EMPTY_STRING;
        }
        this.#handleBtnClick(this.#buttons.get(digit));
      },
    }));
  }
}