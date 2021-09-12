import React from 'react';
import './Players.css';

class Players extends React.Component {
    render() {
        const players = [];

        for (let p of this.props.players) {
            players.push(<li key={p}>{p}</li>);
        }

        return (
            <div className="players">
                <h2 className="players-title">Players</h2>
                <ul>
                    {players}
                </ul>
            </div>
        );
    }
}

export default Players;
