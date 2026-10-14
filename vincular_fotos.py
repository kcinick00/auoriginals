"""Pone en catalogo.js la ruta de cada foto que exista en images/perfumes/.
Uso (en la carpeta del repositorio):   py vincular_fotos.py
"""
import os, re, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
cat = os.path.join(AQUI, "catalogo.js")
carpeta = os.path.join(AQUI, "images", "perfumes")
if not os.path.exists(cat) or not os.path.isdir(carpeta):
    sys.exit("Ejecuta este archivo dentro de la carpeta del repositorio (donde está catalogo.js e images/perfumes).")
fotos = {os.path.splitext(f)[0]: f for f in os.listdir(carpeta) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))}
texto = open(cat, encoding="utf-8").read()
hechas, sin = 0, []
def cambiar(m):
    global hechas
    pid = m.group(1)
    if pid in fotos:
        hechas += 1
        return m.group(0).rsplit('"imagen"', 1)[0] + '"imagen": "images/perfumes/%s"' % fotos[pid] + m.group(2)
    sin.append(pid)
    return m.group(0)
nuevo = re.sub(r'\{"id": "([^"]+)"[^\n]*?"imagen": "[^"]*"(\s*\})', cambiar, texto)
open(cat, "w", encoding="utf-8").write(nuevo)
print(f"Listo: {hechas} perfumes con foto vinculada, {len(sin)} sin foto.")
for p in sin: print("  sin foto:", p)
