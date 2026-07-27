import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Web API キーは公開されても問題ない（クライアント設定）。
// アクセス制御は Firestore セキュリティルールで担保する。
const firebaseConfig = {
  apiKey: 'AIzaSyCdcBrk9fJ_WO7fVDYK4XS3Fg6miLKX-38',
  authDomain: 'trip-map-189f0.firebaseapp.com',
  projectId: 'trip-map-189f0',
  storageBucket: 'trip-map-189f0.firebasestorage.app',
  messagingSenderId: '786949682699',
  appId: '1:786949682699:web:c17f3db783f7568077390e',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
