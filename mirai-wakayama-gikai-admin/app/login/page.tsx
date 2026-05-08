type Props = { searchParams: Promise<{ from?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { from, error } = await searchParams;
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[--color-background] overflow-hidden">
      <div className="mirai-blob mirai-gradient w-[480px] h-[480px] -top-40 -right-40" />
      <div className="mirai-blob mirai-gradient w-[360px] h-[360px] -bottom-32 -left-24 opacity-30" />

      <form
        action="/api/auth"
        method="post"
        className="relative w-full max-w-sm app-card p-8 space-y-5"
      >
        <div>
          <p className="text-[10px] tracking-[0.2em] text-[--color-faint] font-display uppercase">
            Seimu Katsudohi · Admin
          </p>
          <h1 className="text-3xl font-display mt-2 mirai-gradient-text">Login</h1>
          <p className="text-xs text-[--color-muted] mt-2 leading-relaxed">
            限定公開のため、パスワードでアクセスを管理しています。
          </p>
        </div>
        <input type="hidden" name="action" value="login" />
        <input type="hidden" name="from" value={from ?? "/"} />
        <label className="block">
          <span className="text-sm font-medium">パスワード</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1.5 w-full app-input"
          />
        </label>
        {error && (
          <p className="text-sm text-[--color-mirai-red] bg-[--color-mirai-red-soft] rounded-lg px-3 py-2">
            パスワードが違います
          </p>
        )}
        <button className="btn btn-primary w-full">ログイン</button>
      </form>
    </div>
  );
}
