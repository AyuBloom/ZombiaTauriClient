<div class="hud-intro-footer absolute bottom-4 left-4">
    <p>Version 1.2.2-tauri</p>
    <br />
    <p>Made by <strong>Apex</strong> and <strong>Xperience</strong></p>
    <p>Client by <strong>AyuBloom</strong></p>
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    p {
        @apply inline text-xs text-white/40;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    p:not(:first-child):not(:last-child)::after {
        content: "|";
        margin: 0 3px 0 7px;
        color: rgba(255, 255, 255, 0.3);
    }
    strong {
        @apply text-white font-normal;
    }
</style>
