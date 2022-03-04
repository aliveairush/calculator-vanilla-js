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

const doesPrevNumberHavePeriod = () => /\d+\.\d+$/g.test(mathExpressionString);

const appendCharToMathExpression = (number) => {
  mathExpressionString += number
  calculatorOutput.textContent = mathExpressionString;
}

const deleteLastCharFromMathExpression = () => {
  mathExpressionString = mathExpressionString.slice(0, -1);
  calculatorOutput.textContent = mathExpressionString;
}

const clearMathExpression = () => {
  calculatorOutput.textContent = mathExpressionString = '';
}

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
  // TODO если первый символ 0, то второй ноль нельзя вводить
  handleClick: handleClickGeneral,
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

const operatorStack = [];
const operationStack = [];

const isANumber = (number) => /\d+\.\d+|\d+/g.test(number);

const calcButtons = {
  [CLEAR]: clearMathExpression,
  [BACKSPACE]: deleteLastCharFromMathExpression,
  [LEFT_BRACKET]: LEFT_BRACKET_OBJ.handleClick.bind(LEFT_BRACKET_OBJ),
  [RIGHT_BRACKET]: RIGHT_BRACKET_OBJ.handleClick.bind(RIGHT_BRACKET_OBJ),
  [PERIOD]: PERIOD_OBJ.handleClick.bind(PERIOD_OBJ),
  [EQUATION]: () => {
    // MAIN LOGIC


  },
}

// Append all digits(operands) to execute object
DIGIT_OBJ.value.forEach(digit => calcButtons[digit] = DIGIT_OBJ.handleClick.bind(DIGIT_OBJ));
// Append all operators to execute object
OPERATOR_OBJ.value.forEach(operator => calcButtons[operator] = OPERATOR_OBJ.handleClick.bind(OPERATOR_OBJ));


calculator.addEventListener('click', (e) => {
  const inputChar = e.target.dataset.content;
  if (inputChar) calcButtons[inputChar](inputChar);
});

