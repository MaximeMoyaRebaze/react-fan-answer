import './App.css'
import React, { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client'

const App: React.FC = () => {

  // TURN ICE SERVER CONFIG :
  const configurationIceServer = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // BACKEND :
  const serverUrlSocket = 'http://localhost:3001/'

  // REF :
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // INITIALIZE :
  useEffect(() => {
    const peerConnection = new RTCPeerConnection(configurationIceServer);

    const socket = io(serverUrlSocket);
    socket.on('connect', () => {
      console.log('SOCKET CONNECTED');
    });

    const initializeMediaStream = async (peerConnection: RTCPeerConnection, socket: Socket) => {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      socket.on('fan connected', async (data: { room: { offer: RTCSessionDescription }, candidates: RTCIceCandidate[] }) => {

        console.log("SOCKET on(fan connected) : ", data);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.room.offer));
        data.candidates.map(
          async caller => {
            console.log(`Got new remote ICE candidate: ${JSON.stringify(caller)}`);
            await peerConnection.addIceCandidate(new RTCIceCandidate(caller));
          })

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        const roomWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        };
        socket.emit('save room with answer', { room: { answer: roomWithAnswer.answer }, id: 'uniqueID' })

      })

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          console.log("ADD_TRACK", track);
          peerConnection.addTrack(track, localStream);
        });
      }

      peerConnection.addEventListener('icecandidate', async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit('save callee candidate', { id: 'smartphone: 1', candidate: event.candidate })
        } else {
          console.log('ICE candidate gathering completed.');
        }

      });

    };

    initializeMediaStream(peerConnection, socket);

  }, []);

  return (
    <div>
      <div>
        <h1>FAN</h1>
        <h2>Local Video</h2>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
    </div>
  );
};

export default App;
