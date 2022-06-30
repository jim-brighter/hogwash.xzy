import React from 'react';
import Landing from './component/landing/Landing';
import Waiting from './component/waiting/Waiting';
import Players from './component/players/Players';
import Game from './component/game/Game';
import Chat from './component/chat/Chat';
import './App.css';

const GAME_STATUS = {
    LANDING: 'LANDING',
    WAITING: 'WAITING',
    IN_GAME: 'IN_GAME'
}

class Hogwash extends React.Component {

    websocket;
    playerName;
    gameId;

    constructor(props) {
        super(props);

        this.state = {
            gameStatus: GAME_STATUS.LANDING,
            players: [],
            chatLog: []
        };
    }

    handleLandingSubmit(data) {
        this.playerName = data.name;
        this.gameId = data.gameId;

        this.websocket = new WebSocket(`wss://game.hogwash.xyz?playerName=${this.playerName}&gameId=${this.gameId}`);

        this.initWebsocket();

        this.setState({
            gameStatus: GAME_STATUS.WAITING
        });
    }

    initWebsocket() {
        this.websocket.onopen = (e) => {
            console.log('Websocket connection open');
        };

        this.websocket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            switch(data.action) {
                case 'sendmessage':
                    this.handleNewChatMessage(data);
                    break;
                case 'newplayer':
                    this.handleNewPlayer(data);
                    break;
                default:
                    console.error('Unhandled websocket message');
                    break;
            }
        };
    }

    handleNewChatMessage(data) {
        const chatLog = this.state.chatLog.slice();
        chatLog.push({
            text: data.message,
            user: data.user,
            key: chatLog.length
        });

        this.setState({
            chatLog
        });
    }

    handleNewPlayer(data) {
        this.setState({
            players: data.players
        });
    }

    render() {
        if (this.state.gameStatus === GAME_STATUS.LANDING) {
            return (
                <Landing
                    onLandingSubmit={(data) => this.handleLandingSubmit(data)}
                />
            );
        }
        else if (this.state.gameStatus === GAME_STATUS.WAITING) {
            return (
                <Waiting
                    players={this.state.players}
                />
            );
        }
        else {
            return (
                <div className="app">
                    <Players
                        players={this.state.players}
                    />
                    <Game />
                    <Chat
                        playerName={this.playerName}
                        gameId={this.gameId}
                        websocket={this.websocket}
                        chatLog={this.state.chatLog}
                    />
                </div>
            );
        }
    }
}

function App() {
    return (
        <Hogwash />
    );
}

export default App;
