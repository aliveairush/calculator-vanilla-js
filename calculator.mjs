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

    this.#renderCalcHtml(container);

    this.#inputString = DIGITS[0];
    this.#calculatorHtmlElem = container.querySelector('.calculator');
    this.#inputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-input");
    this.#outputTextHtmlElem = this.#calculatorHtmlElem.querySelector(".calc__item-output");
    this.#operationStack = [];
    this.#numberStack = [];

    // Event listener будет отлавливать все клики по кнопкам
    this.#calculatorHtmlElem.addEventListener('click', (e) => {
      try {
        const clickedBtn = this.#calcButtons.get(e.target.dataset.content);
        if (clickedBtn) { // если data-content != null значит это кнопка
          clickedBtn.handleClick(clickedBtn); // Выполняем функцию по нажатию на кнопку
        }
      } catch (error) {
        console.warn(error.message);
      }
    });

    // Таблица из кнопок и соответствующих им функций по нажатию на кнопку
    this.#calcButtons = this.#calcButtonInitialization();
  }

  #calcButtonInitialization = () => {
    const map = new Map(Object.entries({
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
          handleClick: () => {
            if (this.#inputString === DIGITS[0]) {
              this.#inputString = EMPTY_STRING;
            }
            this.#handleBtnClick.call(this, this.#calcButtons.get(LEFT_BRACKET));
          },
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
          handleClick: () => {
            if (doesLastNumberContainPeriod(this.#inputString)) throw new Error("There cannot be 2 dots in one number");
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
              const mathChunks = splitOnMathChunks(this.#inputString);

              for (const chunk of mathChunks) {
                if (isANumber(chunk)) { // Если число добавляем в стек чисел
                  this.#numberStack.push(chunk);
                }
                else { // Иначе значит операция, выполнить операцию
                  const btn = this.#calcButtons.get(chunk);
                  btn.handleExecution(btn);
                }
              }
              this.#executeAllOperationsInStack(); // Выполнить все оставшиеся операции

              const finalResult = this.#numberStack.pop(); // В стеке останется одно число = ответ

              this.#displayMathResult(finalResult);
              this.#updateMathExpression(finalResult);
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
        // Если в строке только один 0, то мы должны его переписать
        if (this.#inputString === DIGITS[0]) {
          this.#inputString = EMPTY_STRING;
        }
        this.#handleBtnClick(this.#calcButtons.get(digit));
      },
    }));

    return map;
  }

  #updateMathExpression(expression) {
    this.#inputTextHtmlElem.textContent = this.#inputString = expression;
  }

  #deleteLastCharFromMathExpression = () => {
    // Если был введен 1 символ, то после его стирания нужно установить дефолт в 0
    if (this.#inputString.length === 1) {
      this.#updateMathExpression(DIGITS[0]);
    }
    else { // Иначе просто передаем новую строку на 1 символ короче
      this.#updateMathExpression(this.#inputString.slice(0, -1));
    }
  }

  #prevCharacter = () => this.#inputString[this.#inputString.length - 1] || EMPTY_STRING;

  #handleBtnClick = (btn) => {
    // Если текущий символ не допустим (например * не может быть после +), то выбрасываем ошибку
    const previousChar = this.#prevCharacter();
    if (!btn.possiblePrevValues.includes(previousChar)) {
      throw new Error(`${btn.value} cant be used after ${previousChar}`);
    }
    this.#updateMathExpression(this.#inputString + btn.value);
  }

  #executeLastOperation = () => {
    const secondOperand = Number(this.#numberStack.pop()); // Второй операнд - число
    const firstOperand = Number(this.#numberStack.pop()); // Первый операнд - число
    const operationSymbol = this.#operationStack.pop(); // Последняя операция -+*/
    const mathFunc = this.#calcButtons.get(operationSymbol).mathFunction // Получаем нужную функцию по символу
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

  /**
   * Функция управляет решением как поступить с операцией.
   */
  #handleExecution = (btn) => {
    const operationStack = this.#operationStack;
    // Если стек операций пустой, то сразу добавляем операцию в стек и выходим из функции
    if (isEmpty(operationStack)) {
      operationStack.push(btn.value);
      return
    }

    let prevBtn = this.#calcButtons.get(peek(operationStack)); // Достаем прошлую операцию из стека

    while (prevBtn && btn.level <= prevBtn.level) { // Выполнение операции пока не останется операций или текущая операция не будет выше в приоритете предыдущей
      this.#executeLastOperation();
      prevBtn = this.#calcButtons.get(peek(this.#operationStack));
    }
    this.#operationStack.push(btn.value);
  }

  /**
   * Функция отображает результат вычисления
   */
  #displayMathResult = (result) => {
    this.#outputTextHtmlElem.insertAdjacentHTML("beforeend", `<span>${this.#inputString} = ${result}</span>`)
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
      handleExecution: this.#handleExecution,
    }
  }

  #renderCalcHtml = (container) => {
    container.insertAdjacentHTML("beforeend", `<div class="calculator">
  <div class="calc__item calc__item-header">
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
  <div class="calc__item calc__item_light-blue" data-content="="></div>
</div>`)
  }
}