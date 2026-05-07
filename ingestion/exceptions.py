class FuenteNoDisponibleError(Exception):
    """La fuente de datos no respondió o devolvió contenido inválido."""

    def __init__(self, fuente: str, detalle: str):
        self.fuente = fuente
        self.detalle = detalle
        super().__init__(f"[{fuente}] {detalle}")
