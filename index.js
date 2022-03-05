const calculator = document.querySelector('.calculator');
const calculatorOutput = calculator.querySelector(".calc__item-input");

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
const EQUATION = '='

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const OPERATORS = [PLUS, MINUS, MULTIPLICATION, DIVISION];

let mathExpressionString = '';
const operatorStack = [];
const operationStack = [];

const peek = (stack) => stack[stack.length - 1];

const doesPrevNumberHavePeriod = () => /\d+\.\d+$/g.test(mathExpressionString);

const appendCharToMathExpression = (number) => {
  mathExpressionString += number
  calculatorOutput.textContent = mathExpressionString;
}

const deleteLastCharFromMathExpression = () => {
  mathExpressionString = mathExpressionString.slice(0, -1);
  calculatorOutput.textContent = mathExpressionString;
}

const clearMathExpression = () => calculatorOutput.textContent = mathExpressionString = '';

const prevCharacter = () => mathExpressionString.charAt(mathExpressionString.length - 1) || '';


const handleClickGeneral = function (char) {
  if (!this.possiblePrevValues.includes(prevCharacter())) {
    console.log("ERROR")
    return
  }
  appendCharToMathExpression(char);
}

const DIGIT_OBJ = {
  value: NUMBERS,
  possiblePrevValues: [EMPTY_STRING, ...NUMBERS, ...OPERATORS, PERIOD, LEFT_BRACKET],
  handleClick: handleClickGeneral,  // TODO если первый символ 0, то второй ноль нельзя вводить
};

const OPERATOR_OBJ = {
  value: OPERATORS,
  possiblePrevValues: [...NUMBERS, RIGHT_BRACKET],
  handleClick: handleClickGeneral
}

const PERIOD_OBJ = {
  value: PERIOD,
  possiblePrevValues: NUMBERS,
  handleClick(char) {
    if (doesPrevNumberHavePeriod()) console.error("Error")
    else handleClickGeneral.call(this, char);
  }
}

const LEFT_BRACKET_OBJ = {
  value: LEFT_BRACKET,
  possiblePrevValues: [EMPTY_STRING, ...OPERATORS, LEFT_BRACKET],
  handleClick: handleClickGeneral
}

const RIGHT_BRACKET_OBJ = {
  value: RIGHT_BRACKET,
  possiblePrevValues: [...NUMBERS, RIGHT_BRACKET],
  handleClick: handleClickGeneral,   // TODO доделать проверки: Что до этого шло выражение и что до этого была левая скобка
}

const handleOperationRecord = function () {
  if (operationStack.length === 0) {
    operationStack.push(this.value);
    return
  }
  let prevOperation = map.get(peek(operationStack));

  while (prevOperation && this.level <= prevOperation.level) {
    const secondOperand = operatorStack.pop();
    const firstOperand = operatorStack.pop();

    const result = prevOperation.mathFunction(+firstOperand, +secondOperand);

    operatorStack.push(result);
    operationStack.pop();
    prevOperation = map.get(peek(operationStack));
  }
  operationStack.push(this.value);
}

const map = new Map(Object.entries({
  [CLEAR]: {
    handleClick: clearMathExpression
  },
  [BACKSPACE]: {
    handleClick: deleteLastCharFromMathExpression
  },
  [LEFT_BRACKET]: {
    value: LEFT_BRACKET,
    level: 0,
    handleClick: LEFT_BRACKET_OBJ.handleClick.bind(LEFT_BRACKET_OBJ),
    handleExecution: () => operationStack.push(LEFT_BRACKET)
  },
  [RIGHT_BRACKET]: {
    value: RIGHT_BRACKET,
    handleClick: RIGHT_BRACKET_OBJ.handleClick.bind(RIGHT_BRACKET_OBJ),
    handleExecution: ()=> {
      let prevOperation = map.get(peek(operationStack));

      while (prevOperation.value !== LEFT_BRACKET) {
        const secondOperand = operatorStack.pop();
        const firstOperand = operatorStack.pop();

        const result = prevOperation.mathFunction(+firstOperand, +secondOperand);

        operatorStack.push(result);
        operationStack.pop();
        prevOperation = map.get(operationStack.pop());
      }
    }
  },
  [PERIOD]: {
    value: PERIOD,
    handleClick: PERIOD_OBJ.handleClick.bind(PERIOD_OBJ)
  },
  [PLUS]: {
    value: PLUS,
    level: 1,
    handleClick: OPERATOR_OBJ.handleClick.bind(OPERATOR_OBJ),
    mathFunction: (a, b) => {
      console.log(`Math operation ${a} + ${b};`)
      return a + b;
    },
    handleExecution: handleOperationRecord,
  },
  [MINUS]: {
    value: MINUS,
    level: 1,
    handleClick: OPERATOR_OBJ.handleClick.bind(OPERATOR_OBJ),
    mathFunction: (a, b) => {
      console.log(`Math operation ${a} - ${b};`)
      return a - b;
    },
    handleExecution: handleOperationRecord,
  },
  [MULTIPLICATION]: {
    value: MULTIPLICATION,
    level: 2,
    handleClick: OPERATOR_OBJ.handleClick.bind(OPERATOR_OBJ),
    mathFunction: (a, b) => {
      console.log(`Math operation ${a} * ${b};`)
      return a * b;
    },
    handleExecution: handleOperationRecord,
  },
  [DIVISION]: {
    value: DIVISION,
    level: 2,
    handleClick: OPERATOR_OBJ.handleClick.bind(OPERATOR_OBJ),
    mathFunction: (a, b) => {
      console.log(`Math operation ${a} / ${b};`)
      return a / b;
    },
    handleExecution: handleOperationRecord,
  },
  [EQUATION]: {
    handleClick: () => {
      const mockExpression = '1+2*(3+4/2-(1+2))*2+1'
      const mathRecord = mathExpressionString.match(/[()+-/*//]|\d+\.\d+|\d+/g);
      console.log("Records", mathRecord)
      for (const record of mathRecord) {
        console.log("Record", record);
        map.get(record).handleExecution();
      }

      // Довыполнить оставшиеся операции
      while (operationStack.length > 0) {
        const bOperand = operatorStack.pop();
        const aOperand = operatorStack.pop();
        const currentOperation = operationStack.pop()

        const result = map.get(currentOperation).mathFunction(+aOperand, +bOperand);
        operatorStack.push(result);
      }
      console.log("RESULT", operatorStack.pop())
    }
  },
}));

DIGIT_OBJ.value.forEach(digit => map.set(digit, {
  handleClick: handleClickGeneral.bind(DIGIT_OBJ),
  handleExecution: () => operatorStack.push(digit)
}));

calculator.addEventListener('click', (e) => {
  const inputChar = e.target.dataset.content;
  if (inputChar) map.get(inputChar).handleClick(inputChar);
});

