import type { Socket } from 'socket.io-client';
import io from 'socket.io-client'


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

// LOCALSTREAM : 
export async function createLocalStream(localVideoRef: React.RefObject<HTMLVideoElement>) {
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    return localStream
}



// SOCKET :
export function createSocketConnection(serverUrlSocket: string) {
    const socket = io(serverUrlSocket);
    socket.on('connect', () => {
        console.log('SOCKET CONNECTED');
    })
    return socket
}

// PEERCONNECTION :
export function createPeerConnection(localStream: MediaStream, socket: Socket) {

    const peerConnection = new RTCPeerConnection(configurationIceServer);

    // ADD LOCAL STREAM TRACKS :
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            console.log("ADD_TRACK", track);
            peerConnection.addTrack(track, localStream);
        });
    }

    // SOCKET LISTENER :
    socket.on('fan connected with regie', async (data: { room: { offer: RTCSessionDescription }, candidates: RTCIceCandidate[], fanRoomId: string }) => {

        console.log("SOCKET on fan connected) : ", data);
        // PEER CONNECTION EVENT LISTENER :
        peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                socket.emit('save fan callee candidate for regie', { candidate: event.candidate, id: data.fanRoomId })
            } else {
                console.log('ICE candidate gathering completed.');
            }

        });
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

        socket.emit('save fan room with answer for regie', { room: { answer: roomWithAnswer.answer }, id: data.fanRoomId })

    })

    return peerConnection
}