var abChess = {};
var config = {
    // clickable: false,
    // draggable: false
};
var currentIndex = 0;
var firstButton = document.getElementById("first-button");
var lastButton = document.getElementById("last-button");
var lastIndex = 0;
var moves = [];
var movesDiv = document.getElementById("moves-div");
var moveNumberSpanClass = "move-number-span";
var moveSpanClass = "move-span";
var nextButton = document.getElementById("next-button");
var pgnImportButton = document.getElementById("pgn-button");
var pgnTextarea = document.getElementById("pgn-textarea");
var previousButton = document.getElementById("previous-button");
var selectedSpanId = "move-span_selected";

abChess = new AbChess("chessboard", config);
abChess.setFEN();

function addMoveSpan(move, i) {
    var movesDiv = document.getElementById("moves-div");
    var numberSpan = {};
    var span = document.createElement("SPAN");
    span.className = "move-span";
    span.innerText = move;
    span.addEventListener("click", function () {
        navigate(i + 1);
    });
    if (i % 2 === 0) {
        numberSpan = document.createElement("SPAN");
        numberSpan.className = "move-number-span";
        numberSpan.innerText = i / 2 + 1;
        movesDiv.appendChild(numberSpan);
    }
    movesDiv.appendChild(span);
}

function navigate(index) {
    var scroll = 0;
    var scrollIndex = 0;
    var selectedSpan = document.getElementById(selectedSpanId);
    var spans = document.getElementsByClassName(moveSpanClass);
    if (index < 0 || index > lastIndex) {
        return;
    }
    currentIndex = index;
    abChess.view(currentIndex);
    if (selectedSpan !== null) {
        selectedSpan.removeAttribute("id");
    }
    if (index > 0 && spans.length > 0) {
        spans[index - 1].id = selectedSpanId;
        scrollIndex = (index % 2 === 1)
            ? (index - 1) / 2
            : (index - 2) / 2;
        scroll = movesDiv.scrollHeight / (spans.length / 2) *
            scrollIndex - movesDiv.offsetHeight / 2;
        movesDiv.scrollTop = scroll;
    }
}


function clearSpans() {
    while (movesDiv.hasChildNodes()) {
        movesDiv.removeChild(movesDiv.lastElementChild);
    }
}

function importPGN() {
    var pgn = pgnTextarea.value;
    if (!abChess.isValidPGN(pgn)) {
        alert("The PGN string is not valid");
        return;
    }
    abChess.setPGN(pgn);
    clearSpans();
    moves = abChess.getMovesPGN();
    moves.forEach(addMoveSpan);
    lastIndex = moves.length;
    navigate(lastIndex);
}

firstButton.addEventListener("click", function () {
    navigate(0);
});
lastButton.addEventListener("click", function () {
    navigate(lastIndex);
});
nextButton.addEventListener("click", function () {
    navigate(currentIndex + 1);
});
previousButton.addEventListener("click", function () {
    navigate(currentIndex - 1);
});
pgnImportButton.addEventListener("click", importPGN);