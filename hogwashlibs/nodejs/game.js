class Player {
    connectionId;
    name;
    score;

    constructor(connectionId, name) {
        this.connectionId = connectionId;
        this.name = name;
    }
};

class Guess {
    guess;
    playerConnectionId;
    votes;

    constructor(guess, playerConnectionId) {
        this.guess = guess;
        this.playerConnectionId = playerConnectionId;
    }
};

class Round {
    number;
    word;
    definition;
    guesses;

    constructor(number, word, definition) {
        this.number = number;
        this.word = word;
        this.definition = definition;
    }
};

class Game {
    gameId;
    players;
    rounds;
    ttl;

    constructor(gameId, ttl) {
        this.gameId = gameId;
        this.ttl = ttl;
    }
};

module.exports = {
    Player,
    Guess,
    Round,
    Game
};
