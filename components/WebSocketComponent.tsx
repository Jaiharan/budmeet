"use client";
import { useState } from 'react';
import useWebSocket from '@/hooks/useWebSocket';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';

const WebSocketComponent = () => {
  const { messages, sendMessage } = useWebSocket('ws://localhost:8080');
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    sendMessage(input);
    setInput('');
  };

  return (
    <div>
      <h1 className="text-4xl m-5 font-medium">WebSocket Chat</h1>
      <div className="flex flex-col space-y-4 gap-3">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <Button variant="default" onClick={handleSendMessage}>Send</Button>
        <Card className="w-full p-4 gap-2 text-lg">
          <div>
            <h2>Messages:</h2>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}><strong>{msg.name}:</strong> {msg.message}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WebSocketComponent;
