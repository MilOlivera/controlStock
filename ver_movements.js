const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs } = require('firebase/firestore')
const app = initializeApp({ projectId: 'control-stock-2d36c' })
const db = getFirestore(app)
getDocs(collection(db, 'movements')).then(snap => {
  snap.docs.slice(0, 10).forEach(d => {
    const data = d.data()
    console.log(data.date?.toDate?.()?.toLocaleDateString('es-AR'), '|', data.product, '|', data.type, '|', data.quantity)
  })
  process.exit(0)
})
