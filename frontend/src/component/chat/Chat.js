import React from 'react';
import './Chat.css';

class ChatWindow extends React.Component {
    render() {
        const messages = [];
        for (let m of this.props.messages) {
            messages.push(
                <p key={m.key}>
                    <b key={m.key}>{m.user}:</b> {m.text}
                </p>
            )
        }

        return (
            <div className="chat-window">
                <h2 className="chat-title">Chat</h2>
                {messages}
            </div>
        );
    }
}

class TextEntry extends React.Component {
    render() {
        return (
            <div className="text-entry">
                <textarea placeholder="Start typing..." onKeyDown={(e) => this.props.onKeyDown(e)}></textarea>
            </div>
        );
    }
}

class Chat extends React.Component {
    handleKeyDown(e) {
        if (e.keyCode === 13 && e.shiftKey === false) {
            e.preventDefault();

            this.props.websocket.send(
                JSON.stringify({
                    action: "sendmessage",
                    data: {
                        gameId: this.props.gameId,
                        user: this.props.playerName,
                        message: e.target.value
                    }
                })
            );

            e.target.value = '';
        }
    }

    render() {
        return (
            <div className="chat-component">
                <ChatWindow messages={this.props.chatLog} />
                <TextEntry onKeyDown={(e) => this.handleKeyDown(e)} />
            </div>
        );
    }
}

export default Chat;
