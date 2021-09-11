import React from 'react';
import Players from './component/players/Players';
import Game from './component/game/Game';
import Chat from './component/chat/Chat';
import './App.css';

class Hogwash extends React.Component {
  render() {
    return(
      <div className="app">
        <Players />
        <Game />
        <Chat />
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
