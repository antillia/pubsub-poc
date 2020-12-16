import React, { Component } from 'react';
import * as XMPP from 'stanza';
import { JXT } from 'stanza';

let client;

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogedin: false,
      userjid: '',
      userpassword: '',
      server: 'server.io',
      connection: '',
    };
    this.handleServerChange = this.handleServerChange.bind(this);

    this.handleConnectionChange = this.handleConnectionChange.bind(this);

    this.handleUserChange = this.handleUserChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);

    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisonnect = this.handleDisonnect.bind(this);
    this.handleCreateNode = this.handleCreateNode.bind(this);
    this.handlePublishToNode = this.handlePublishToNode.bind(this);
    this.handleSubscribeToNode = this.handleSubscribeToNode.bind(this);
    this.handleUnSubscribeToNode = this.handleUnSubscribeToNode.bind(this);
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentWillUnmount() {
    if (client !== null) {
      // client.disconnect();
    }
  }

  render() {
    return (
      <div>
        Connection:
        <input
          type="text"
          onChange={this.handleServerChange}
          value={this.state.server}
          placeholder="server.io"
          name="connection"
        />
        <br />
        Server:
        <input
          type="text"
          onChange={this.handleConnectionChange}
          value={this.state.connection}
          placeholder="wss://server:5432/ws"
          name="server"
        />
        <br />
        User Name:
        <input
          type="text"
          onChange={this.handleUserChange}
          value={this.state.userjid}
          name="username"
        />
        <br />
        Password :
        <input
          type="text"
          onChange={this.handlePasswordChange}
          value={this.state.userpassword}
          name="userpassword"
        />
        <br />
        <button onClick={this.handleConnect}>Connect</button>
        <br />
        {this.state.isLogedin ? 'Connected' : 'Disconnected'}
        <br />
        <br />
        <button onClick={this.handleDisonnect}>Disconnect</button>
        <br />
        <br />
        <button onClick={this.handleCreateNode}>CreateNode</button>
        <br />
        <br />
        <button onClick={this.handlePublishToNode}>Publish</button>
        <br />
        <button onClick={this.handleSubscribeToNode}>Subscribe</button>
        <br />
        <button onClick={this.handleUnSubscribeToNode}>Un-Subscribe</button>
        <br />
      </div>
    );
  }

  handleDisonnect = (event) => {
    if (client !== null) {
      client.disconnect();
    }
  };

  handleUserChange = (event) => {
    this.setState({ userjid: event.target.value });
  };

  handleConnectionChange = (event) => {
    this.setState({ connection: event.target.value });
  };

  handleServerChange = (event) => {
    this.setState({ server: event.target.value });
  };
  handlePasswordChange = (event) => {
    this.setState({ userpassword: event.target.value });
  };

  handleConnect = (event) => {
    console.log(
      'handleConnect',
      event,
      this.state.userjid,
      this.state.userpassword
    );
    this.connectXmpp();
  };

  handleCreateNode = (event) => {
    console.log('handleCreateNode', event);

    const nodeName = prompt('Please enter Pubsub Node Name');
    if (nodeName === null || nodeName.trim().length === 0) {
      return;
    }
    this.createPubSubNode(nodeName)
      .then((result) => {
        console.log('Chat createPubSubNode result', result);
        alert('Node Created');
      })
      .catch((error) => {
        console.log('Chat createPubSubNode error', error);
        alert('Error Node Creation. Please see console log', error);
      });
  };

  handlePublishToNode = (event) => {
    console.log('handlePublishToNode', event);

    const nodeName = prompt('Please enter Node Name');
    if (nodeName === null || nodeName.trim().length === 0) {
      return;
    }

    this.publishPubSub(nodeName, 'field1_value', 'field2_value')
      .then((result) =>
        console.log('handlePublishToNode publishPubSub result', result)
      )
      .catch((error) =>
        console.log('handlePublishToNode publishPubSub error', error)
      );
  };

  handleSubscribeToNode = (event) => {
    console.log('handleSubscribeToNode', event);

    const nodeName = prompt('Please enter Pubsub Node Name');
    if (nodeName === null || nodeName.trim().length === 0) {
      return;
    }

    client
      .subscribeToNode('pubsub.' + this.state.server, nodeName)
      .then((result) => {
        console.log('Subscribe to Node result', result);
        alert('Subscribe to Node succesfuly');
      })
      .catch((error) => {
        console.log('Subscribe to Node error', error);
        alert('Error Node Subscription. Please see console log', error);
      });
  };

  handleUnSubscribeToNode = (event) => {
    // client.unsubscribeFromNode(jid, opts, [cb])
    const node = prompt('Please enter Node Name');
    if (node === null || node.trim().length === 0) {
      return;
    }

    console.log('handleUnSubscribeToNode ', node);

    client
      .unsubscribeFromNode('pubsub.' + this.state.server, node)
      .then((result) => {
        console.log('handleUnSubscribeToNode result', result);
      })
      .catch((error) => {
        console.log('handleUnSubscribeToNode error', error);
      });
  };

  connectXmpp() {
    console.log('connectXmpp ');
    if (this.state.userjid === null || this.state.userpassword === null) {
      return;
    }

    if (
      this.state.userjid.length === 0 ||
      this.state.userpassword.length === 0
    ) {
      console.log('connectXmpp', 'Cant Connect');
      return;
    }

    if (client) {
      console.log('XMPP client is defined ', client);
      return;
    }

    const userid = this.state.userjid.includes('@')
      ? this.state.userjid
      : this.state.userjid + '@' + this.state.server;

    client = XMPP.createClient({
      jid: userid,
      password: this.state.userpassword,
      resource: 'web',
      useStreamManagement: true,
      transports: {
        websocket: this.state.connection,
        bosh: false,
      },
      transport: 'websocket',
    });

    client.on('session:started', () => this.onSessionStarted());
    client.on('message', (message) => this.onMessage(message));
    client.on('raw:incoming', (xml) => this.onIncomingRaw(xml));
    client.on('raw:outgoing', (xml) => this.onOutgoingRaw(xml));
    client.on('auth:failed', (xml) => this.onAuthFailed(xml));
    client.on('disconnected', (xml) => this.onDisconnected(xml));
    client.on('connected', (xml) => this.onConnected(xml));
    client.on('stream:error', () => this.onStreamError());
    client.on('session:error', () => this.onSessionError());
    client.on('message:sent', (message) => this.onSent(message));
    client.on('pubsub:published', (item) => this.onItemPublished(item));
    client.on('pubsub:event', (item) => this.onPubSubEvent(item));
    client.use(this.setCustomePubSub(client));
    client.enableKeepAlive({
      interval: 30,
    });

    client.connect();
  }

  setCustomePubSub(client) {
    const NS_MUCMEMBERS = 'urn:xmpp:custompubsub';

    client.stanzas.define({
      // Inject our definition into all pubsub item content slots.
      // These slots are already registered with `itemType` as the
      // type field.
      namespace: NS_MUCMEMBERS,
      aliases: JXT.pubsubItemContentAliases(),
      element: 'customelement',
      fields: {
        field1: JXT.childText(NS_MUCMEMBERS, 'field1', ''),
        field2: JXT.childText(NS_MUCMEMBERS, 'field2', ''),
      },

      // Specify the `itemType` value for our content.
      type: NS_MUCMEMBERS,
    });
  }

  onAuthFailed(xml) {
    console.log('XMPP onAuthFailed', xml);
  }

  onConnected(xml) {
    console.log('XMPP Connected', xml);
  }

  onDisconnected(xml) {
    console.log('XMPP disconnected', xml);
    this.setState({
      isLogedin: false,
    });

    client = null;
  }

  onSessionStarted() {
    console.log('onSessionStarted');
    client.sendPresence();
    this.setState({
      isLogedin: true,
    });
  }

  onStreamError() {
    console.log('XMPP', 'stream:error');
    this.setState({
      isLogedin: false,
    });
  }

  onSessionError() {
    console.log('XMPP', 'session:error');
    this.setState({
      isLogedin: false,
    });
  }

  onOutgoingRaw(xml) {
    console.log('XMPP raw outgoing xml sent', xml);
  }

  onIncomingRaw(xml) {
    console.log('XMPP', 'xml received: ', xml);
  }

  onMessage(message) {
    console.log('XMPP onMessage', message);
  }

  onSent(message) {
    console.log('onSent', message);
  }

  onItemPublished(item) {
    console.log('onItemPublished', item);
  }

  onPubSubEvent(item) {
    console.log('onPubSubEvent', item, item.pubsub);

    if (item.eventType === 'configuration') {
      return;
    }

    if (item.pubsub.eventType === undefined) {
      return;
    }

    if (item.pubsub.eventType === 'items') {
      if (item.pubsub.items.node !== undefined) {
        console.log('onPubSubEvent group_updates');

        item.pubsub.items.published.forEach((element) => {
          console.log('onPubSubEvent group_updates', element);
        });

        return;
      }

      if (
        item.pubsub.items.node !== undefined &&
        item.pubsub.items.node === 'storage:bookmarks'
      ) {
        return;
      }
    }
  }

  createPubSubNode = (nodeId) => {
    const node_config2 = {
      fields: [
        {
          name: 'FORM_TYPE',
          type: 'hidden',
          value: 'http://jabber.org/protocol/pubsub#node_config',
        },
        {
          type: 'list-single',
          name: 'pubsub#publish_model',
          value: 'open',
        },
        {
          type: 'list-single',
          name: 'pubsub#persist_items',
          value: '1',
        },
        {
          type: 'list-single',
          name: 'pubsub#send_last_published_item',
          value: 'on_sub_and_presence',
        },
      ],
      type: 'submit',
    };

    return new Promise((resolve, reject) => {
      client
        .createNode('pubsub.' + this.state.server, nodeId, node_config2)
        .then((result) => {
          console.log('onTestClick result', result);
          resolve(result);
        })
        .catch((error) => {
          console.log('onTestClick error', error);
          reject(error);
        });
    });
  };

  publishPubSub = (node, field1, field2) => {
    const payload = {
      itemType: 'urn:xmpp:custompubsub',
      field1: field1,
      field2: field2,
    };
    return new Promise((resolve, reject) => {
      client
        .publish('pubsub.' + this.state.server, node, payload)
        .then((result) => {
          console.log('publishPubSub result', result);
          resolve(result);
        })
        .catch((error) => {
          console.log('publishPubSub error', error);
          reject(error);
        });
    });
  };
}

export default Chat;
