import React from 'react';
import Players from './component/players/Players';
import Game from './component/game/Game';
import Chat from './component/chat/Chat';
import './App.css';

class Hogwash extends React.Component {
    constructor(props) {
        super(props);

        const playerName = 'jim';
        const gameId = '1';

        const websocket = new WebSocket(`wss://game.hogwash.xyz?playerName=${playerName}&gameId=${gameId}`);

        this.state = {
            playerName,
            gameId,
            websocket,
            chatLog: []
        };

        this.initWebsocket();
    }

    initWebsocket() {
        const websocket = this.state.websocket;

        websocket.onopen = (e) => {
            console.log('Websocket connection open');
        };

        websocket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            switch(data.action) {
                case 'sendmessage':
                    this.handleNewMessage(data);
                    break;
                default:
                    console.error('Unhandled websocket message');
                    break;
            }
        };

        this.setState({
            websocket
        });
    }

    handleNewMessage(data) {
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

    render() {
        return (
            <div className="app">
                <Players />
                <Game />
                <Chat
                    playerName={this.state.playerName}
                    gameId={this.state.gameId}
                    websocket={this.state.websocket}
                    chatLog={this.state.chatLog}
                />
            </div>
        );
    }
}

function App() {
    return (
        <Hogwash />
    );
}

export default App;
