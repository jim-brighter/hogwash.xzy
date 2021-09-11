import React from 'react';
import './Players.css';

class Players extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const players = [];

        for (let i = 0; i < 10; i++) {
            players.push(<li key={i}>Player {i}</li>);
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
