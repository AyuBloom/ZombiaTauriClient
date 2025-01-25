<script>
    import "../app.css";
    const { children } = $props();

    document.onselectstart = () => {
        return false;
    };
</script>

{@render children()}
