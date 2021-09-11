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
    constructor(props) {
        super(props);

        this.state = {
            chatLog: []
        };
    }

    handleKeyDown(e) {
        if (e.keyCode === 13 && e.shiftKey === false) {
            e.preventDefault();

            const chatLog = this.state.chatLog.slice();
            chatLog.push({
                text: e.target.value,
                user: 'me',
                key: chatLog.length
            });

            this.setState({
                chatLog
            });

            e.target.value = '';
        }
    }

    render() {
        return (
            <div className="chat-component">
                <ChatWindow messages={this.state.chatLog} />
                <TextEntry onKeyDown={(e) => this.handleKeyDown(e)} />
            </div>
        );
    }
}

export default Chat;
