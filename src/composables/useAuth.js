import { ref } from 'vue'
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

/**
 * Google 認証を扱う Composable。
 * アクセス制御は Firestore セキュリティルールで行う（クライアント側では制限しない）。
 *
 * @param {object}   options
 * @param {(user: object) => void} [options.onLogin]  ログイン確定時に呼ばれる
 * @param {() => void}              [options.onLogout] ログアウト確定時に呼ばれる
 */
export function useAuth({ onLogin, onLogout } = {}) {
  const currentUser = ref(null)
  const authReady   = ref(false)
  const loginError  = ref('')
  let unsub = null

  async function signIn() {
    loginError.value = ''
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        loginError.value = 'ログインエラー: ' + (e.code ?? e.message)
      }
    }
  }

  async function handleSignOut() {
    await fbSignOut(auth)
  }

  // 認証状態の監視を開始
  function start() {
    unsub = onAuthStateChanged(auth, async user => {
      currentUser.value = user
      authReady.value   = true
      if (user) onLogin?.(user)
      else      onLogout?.()
    })
  }

  // 監視を解除
  function stop() {
    unsub?.()
    unsub = null
  }

  return { currentUser, authReady, loginError, signIn, handleSignOut, start, stop }
}
