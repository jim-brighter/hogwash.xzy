import React from 'react';
import './Landing.css';

class Landing extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: '',
            gameId: ''
        };

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleGameIdChange = this.handleGameIdChange.bind(this);

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleNameChange(event) {
        this.setState({
            name: event.target.value
        });
    }

    handleGameIdChange(event) {
        this.setState({
            gameId: event.target.value
        });
    }

    handleSubmit(event) {
        this.props.onLandingSubmit(this.state);
        event.preventDefault();
    }

    render() {
        return (
            <div className="landing-page">
                <h1>Hogwash</h1>
                <form className="inputs" onSubmit={this.handleSubmit}>
                    <label htmlFor="name">Name:</label>
                    <div className="input-wrapper"><input type="text" id="name" name="name" required="required" onChange={this.handleNameChange}></input></div>
                    <label htmlFor="game-id">Game ID:</label>
                    <div className="input-wrapper"><input type="text" id="game-id" name="game-id" onChange={this.handleGameIdChange}></input></div>

                    <button className="submit-button" type="submit">Submit</button>
                </form>
            </div>
        );
    }
}

export default Landing;
