import React from 'react';
import Chat from './component/chat/Chat';
import './App.css';

class Hogwash extends React.Component {
  render() {
    return(
      <div className="app">
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
