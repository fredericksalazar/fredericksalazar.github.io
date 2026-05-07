import math

import pandas as pd
import pytest

from ingestion.processing.consolidate import (
    calcular_diffs,
    calcular_spread,
    clasificar_variacion,
    consolidar,
)


class TestClasificarVariacion:
    def test_subio(self):
        assert clasificar_variacion(0.5) == "subio"

    def test_bajo(self):
        assert clasificar_variacion(-0.5) == "bajo"

    def test_igual_exacto(self):
        assert clasificar_variacion(0.0) == "igual"

    def test_igual_dentro_epsilon(self):
        assert clasificar_variacion(0.0005) == "igual"
        assert clasificar_variacion(-0.0005) == "igual"

    def test_none(self):
        assert clasificar_variacion(None) is None

    def test_nan(self):
        assert clasificar_variacion(float("nan")) is None


class TestCalcularDiffs:
    def test_primer_registro_sin_previo(self):
        df = pd.DataFrame({"periodo": ["2024-01"], "inflacion_anual": [5.0]})
        out = calcular_diffs(df, ["inflacion_anual"])
        assert math.isnan(out["inflacion_anual_dif"].iloc[0])
        assert out["inflacion_anual_var"].iloc[0] is None

    def test_diff_subio(self):
        df = pd.DataFrame(
            {"periodo": ["2024-01", "2024-02"], "inflacion_anual": [5.0, 5.5]}
        )
        out = calcular_diffs(df, ["inflacion_anual"])
        assert out["inflacion_anual_dif"].iloc[1] == pytest.approx(0.5)
        assert out["inflacion_anual_var"].iloc[1] == "subio"

    def test_diff_bajo(self):
        df = pd.DataFrame(
            {"periodo": ["2024-01", "2024-02"], "inflacion_anual": [5.0, 4.5]}
        )
        out = calcular_diffs(df, ["inflacion_anual"])
        assert out["inflacion_anual_var"].iloc[1] == "bajo"

    def test_diff_igual(self):
        df = pd.DataFrame(
            {"periodo": ["2024-01", "2024-02"], "inflacion_anual": [5.0, 5.0]}
        )
        out = calcular_diffs(df, ["inflacion_anual"])
        assert out["inflacion_anual_var"].iloc[1] == "igual"


class TestCalcularSpread:
    def test_spread_simple(self):
        df = pd.DataFrame(
            {
                "periodo": ["2024-01", "2024-02"],
                "tasa_interes": [10.0, 11.0],
                "inflacion_anual": [5.0, 6.0],
            }
        )
        out = calcular_spread(df)
        assert out["spread"].iloc[0] == pytest.approx(5.0)
        assert out["spread"].iloc[1] == pytest.approx(5.0)
        assert out["spread_var"].iloc[1] == "igual"

    def test_spread_negativo(self):
        df = pd.DataFrame(
            {
                "periodo": ["2024-01"],
                "tasa_interes": [3.0],
                "inflacion_anual": [10.0],
            }
        )
        out = calcular_spread(df)
        assert out["spread"].iloc[0] == pytest.approx(-7.0)


class TestConsolidar:
    def test_pipeline_completo(self):
        banrep = pd.DataFrame(
            {
                "periodo": ["2024-01", "2024-02", "2024-03"],
                "tasa_interes": [12.0, 12.0, 11.5],
            }
        )
        dane = pd.DataFrame(
            {
                "periodo": ["2024-01", "2024-02", "2024-03"],
                "inflacion_mensual": [1.0, 0.5, 0.3],
                "inflacion_anual": [8.0, 7.5, 7.0],
            }
        )
        out = consolidar(banrep, dane)
        assert len(out) == 3
        assert list(out.columns)[:4] == [
            "periodo",
            "inflacion_anual",
            "inflacion_anual_dif",
            "inflacion_anual_var",
        ]
        assert out["spread"].iloc[0] == pytest.approx(4.0)
        assert out["spread_var"].iloc[2] == "igual"  # spread no cambia 4.5→4.5

    def test_idempotencia(self):
        banrep = pd.DataFrame(
            {"periodo": ["2024-01", "2024-02"], "tasa_interes": [10.0, 10.5]}
        )
        dane = pd.DataFrame(
            {
                "periodo": ["2024-01", "2024-02"],
                "inflacion_mensual": [1.0, 0.5],
                "inflacion_anual": [5.0, 5.5],
            }
        )
        out1 = consolidar(banrep, dane)
        out2 = consolidar(banrep, dane)
        pd.testing.assert_frame_equal(out1, out2)

    def test_filtra_periodos_incompletos(self):
        banrep = pd.DataFrame(
            {"periodo": ["2024-01", "2024-02"], "tasa_interes": [10.0, 10.5]}
        )
        dane = pd.DataFrame(
            {
                "periodo": ["2024-01"],
                "inflacion_mensual": [1.0],
                "inflacion_anual": [5.0],
            }
        )
        out = consolidar(banrep, dane)
        assert len(out) == 1
        assert out["periodo"].iloc[0] == "2024-01"
