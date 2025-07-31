
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

const firebaseConfig = {
  apiKey: "AIzaSyC07Gs8L5vxlUmC561PKbxthewA1mrxYDk",
  authDomain: "zylos-test.firebaseapp.com",
  databaseURL: "https://zylos-test-default-rtdb.firebaseio.com",
  projectId: "zylos-test",
  storageBucket: "zylos-test.firebasestorage.app",
  messagingSenderId: "553027007913",
  appId: "1:553027007913:web:2daa37ddf2b2c7c20b00b8"
};

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, get, child } from "firebase/database";

const firebaseApp = initializeApp(firebaseConfig)
const db = getDatabase(firebaseApp)

app.use('*', cors())

app.post('/signup', async (c) => {
  const body = await c.req.json()
  const { email, password } = body
  const userId = Date.now().toString()

  const userRef = push(ref(db, 'users'))
  await set(userRef, {
    email,
    password,
    userId,
    profile: {
      joined: new Date().toISOString()
    }
  })
  return c.json({ userId })
})

app.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body

  const snapshot = await get(ref(db, 'users'))
  if (snapshot.exists()) {
    const users = snapshot.val()
    for (const key in users) {
      if (users[key].email === email && users[key].password === password) {
        return c.json({ userId: users[key].userId })
      }
    }
  }
  return c.json({ error: 'Invalid credentials' }, 401)
})

app.get('/profile/:uid', async (c) => {
  const uid = c.req.param('uid')
  const snapshot = await get(ref(db, 'users'))
  if (snapshot.exists()) {
    const users = snapshot.val()
    for (const key in users) {
      if (users[key].userId === uid) {
        return c.json(users[key])
      }
    }
  }
  return c.json({ error: 'User not found' }, 404)
})

app.post('/chat/send', async (c) => {
  const body = await c.req.json()
  const { from, to, message } = body
  const msgRef = push(ref(db, 'messages'))
  await set(msgRef, {
    from,
    to,
    message,
    timestamp: new Date().toISOString()
  })
  return c.json({ success: true })
})

app.get('/chat/:uid1/:uid2', async (c) => {
  const { uid1, uid2 } = c.req.param()
  const snapshot = await get(ref(db, 'messages'))
  const results = []
  if (snapshot.exists()) {
    const messages = snapshot.val()
    for (const key in messages) {
      const msg = messages[key]
      if ((msg.from === uid1 && msg.to === uid2) || (msg.from === uid2 && msg.to === uid1)) {
        results.push(msg)
      }
    }
  }
  return c.json(results)
})

export default app
