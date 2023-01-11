const letters = document.querySelectorAll('.scoreboard-letter');
const loadingDiv = document.querySelector('.info-bar');
const ANSWER_LENGTH = 5;
const ROUNDS = 6;

// now inside init, can do await whenever we want, which is nice
async function init() {

  let currentGuess = '';
  let currentRow = 0;
  let isLoading = true;

  const res = await fetch("https://words.dev-apis.com/word-of-the-day?random=1");
  //const { word } = await res.json();
  const resObj = await res.json();
  const word = resObj.word.toUpperCase();
  const wordOfTheDayLettersArr = word.split("");
  let done = false;
  setLoading(false);
  isLoading = false;

  console.log(word);

  function backspace() {
    //if (currentGuess.length > 0) {
      //letters[(currentGuess.length - 1) + (currentRow * ANSWER_LENGTH)].innerText = ""; // BUG! this way makes you delete at the end of prior row
      currentGuess = currentGuess.substring(0, currentGuess.length - 1); // substring empty string is still empty string
      letters[(currentGuess.length) + (currentRow * ANSWER_LENGTH)].innerText = '';
    //}
  }

  function markInvalidWord() {
    // called repaint. remove if there then readd
    for (let i=0; i<ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");
      setTimeout(function () {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
      }, 10);
    }
    //alert('Not a valid word, yo');
  }

  function addLetter(letter) {
    // keep track of a count to add the letter to
    // handle case of being able to change last letter
    if (currentGuess.length < ANSWER_LENGTH) {
      // add letter to the end
      currentGuess += letter;
    } else {
      // replace the last letter
      currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
    }

    // updates DOM with letter
    letters[(currentGuess.length - 1) + (currentRow * ANSWER_LENGTH)].innerText = letter;
  }

  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      // do nothing and return
      return;
    } 

    // TODO validate the word
    isLoading = true;
    setLoading(true);
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word: currentGuess })
    });

    const resObj = await res.json();
    const { validWord } = resObj;
    //const validWord = resObj.validWord;

    isLoading = false;
    setLoading(false);

    if (!validWord) {
      markInvalidWord();
      return;
    }

    const guessLettersArr = currentGuess.split("");
    const map = makeMap(wordOfTheDayLettersArr);
    //console.log(map);

    for (let i=0; i<ANSWER_LENGTH; i++) {
      // mark as correct
      if (guessLettersArr[i] === wordOfTheDayLettersArr[i]) {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
        map[guessLettersArr[i]]--;
      } 
    }

    for (let i=0; i<ANSWER_LENGTH; i++) {
      // mark as correct
      if (guessLettersArr[i] === wordOfTheDayLettersArr[i]) {
        // do nothing, we already did it
      } else if (wordOfTheDayLettersArr.includes(guessLettersArr[i]) && map[guessLettersArr[i]] > 0){
        letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
        map[guessLettersArr[i]]--;
      } else {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
      }
    }

    currentRow++;

    if (currentGuess === word) {
      // win
      alert('you win!');
      document.querySelector('.brand').classList.add("winner");
      done = true;
      return;
    } else if (currentRow === ROUNDS) {
      // LOST
      alert(`you lose, the word was ${word}`);
      done = true;
    }

    currentGuess = '';
  }

  // event listener here (keydown want to catch backspace and enter which doesnt activate on keypress)
  // naming functions are optional - when there's an error, you see the whole stack trace in console with function name (anon function if no name, helps debug)
  // try not to do too much in event listener, try to delegate things out
  document.addEventListener('keydown', function handleKeyPress (event) {

    if (done || isLoading) {
      // do nothing
      return;
    }

    const action = event.key;

//    console.log(action);

    if (action === 'Enter') {
      // handle that
      commit();
    } else if (action === 'Backspace') {
      backspace();
    } else if (isLetter(action)) {
      addLetter(action.toUpperCase())
    } else {
      // do nothing
      // like explicit do nothing so telling future person reason code i know that i didn't put an else here and i am expecting it to do nothing
    }

    // can leave it implicit // return undefined;
  });
}

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function setLoading(isLoading) {
  loadingDiv.classList.toggle('hidden', !isLoading);
  //isLoading = false;
}

function makeMap (array) {
  const obj = {};
  for (let i=0; i<array.length; i++) {
    const letter = array[i]
    if (obj[letter]) {// if exist return true
      obj[letter]++;
    } else {
      obj[letter] = 1;
    }
  }

  return obj;
}

init();