# Steel Beams & Plate Girders — LRFD Capacity Digest

Tight, code-ready notes for flexure, shear, and bearing/web checks on straight I-shapes and plate girders in bridge work. Oriented to AASHTO LRFD (2020+ logic), with MassDOT addenda where helpful. Citations point to LRFD-aligned FHWA/NSBA sources and the MassDOT rating manual.

---

## Flexural resistance (the anchor-point method)

AASHTO frames flexural capacity for noncomposite I-sections (and composite in negative flexure) around **three limit states**; the governing resistance is the smallest of:

* Lateral-torsional buckling (LTB)
* Compression-flange local buckling (FLB)
* Tension-flange yielding (TFY)

All three are expressed with the **two-anchor-point** scheme:
**Anchor 1** at compact limit (unbraced length $L_p$ or flange slenderness $\lambda_{pf}$) with plateau resistance $M_{\max}$;
**Anchor 2** at noncompact limit ($L_r$ or $\lambda_{rf}$) where the **elastic** buckling resistance equals $R_b F_{yr} S_{xc}$. Between anchors, interpolate linearly; for $L_b>L_r$ use the elastic curve. Apply moment-gradient with $C_b$ to LTB (cap by $M_{\max}$). $\phi_b$ for steel flexure is taken as 1.0 in LRFD. ([American Institute of Steel Construction][1])

### What the variables are, in practice

* $M_{\max} = R_{pc}\, M_p$ for compact/noncompact webs; $R_{pc}$ is a web plastification factor, $M_p$ plastic moment.
* $F_{yr}$ is onset-of-yield stress in compression flange including residuals; commonly $0.7F_{yc}$.
* $R_b$ is the **web load-shedding** factor (≈1.0 for compact/noncompact webs).
* $S_{xc}$ is the elastic section modulus at the compression flange.
* $C_b$ is the LTB moment-gradient modifier; LTB resistance is scaled by $C_b$ (but not beyond $M_{\max}$). ([American Institute of Steel Construction][1])

### Coding it (pseudocode)

```pseudo
function flexure_capacity_LRFD(section, Lb, Cb):
  // Precompute plateau and elastic anchors for LTB and FLB
  Mmax  = Rpc * Mp                           // plateau
  Mel_LTB = Rb*Fyr*Sxc * f_elastic_LTB(Lb)   // at Lr equals RbFyrSxc
  Mel_FLB = Rb*Fyr*Sxc * f_elastic_FLB(λf)   // at λrf equals RbFyrSxc

  // Interpolate between anchors for inelastic range
  Mltb = piecewise_LTB(Mmax, Rb*Fyr*Sxc, Lp, Lr, Lb)
  Mltb = min(Mltb*Cb, Mmax)                  // moment gradient cap

  Mflb = piecewise_FLB(Mmax, Rb*Fyr*Sxc, λpf, λrf, λf)

  // TFY resists general yielding of tension flange; scaled by web slenderness via Rpt
  Mtfy = Rpt * My_tension_flange             // see AASHTO TFY definition

  Mn = min(Mltb, Mflb, Mtfy)
  ϕ = 1.00
  Mr = ϕ * Mn
  return Mr
```

> Implementation note: AASHTO provides explicit formulas for $L_p, L_r$, the elastic LTB/FLB curves, and the plastification factors $R_{pc}, R_{pt}$. NSBA’s Steel Bridge Design Handbook (2020 alignment) walks through this **exact** anchor-point logic for coding. ([American Institute of Steel Construction][1])

---

## Shear resistance of webs (stiffened & unstiffened panels)

AASHTO treats web shear by **panel**, distinguishing unstiffened panels (no transverse stiffeners within \~3D) from stiffened ones (with intermediate stiffeners). The nominal shear resistance is built from the **plastic shear** of the web and an elastic buckling modifier; end panels are special-cased.

* Plastic shear (per panel):

  $$
  V_p \;=\; 0.58\,F_{yw}\,D\,t_w
  $$

  where $D$ is clear web depth, $t_w$ web thickness. ϕ for shear is 1.00; $V_r=\phi_v V_n$. ([Federal Highway Administration][2])

* **Stiffened** or **unstiffened** interior panel nominal:

  $$
  V_n \;=\; C\,V_p,\qquad C \equiv \frac{V_{cr}}{V_p}
  $$

  with elastic plate buckling $V_{cr}$ from $\tau_{cr}$ and panel area:

  $$
  \tau_{cr} \;=\; k_v \,\frac{\pi^2 E}{12(1-\nu^2)}\left(\frac{t_w}{D}\right)^{\!2},\quad
  V_{cr} \;=\; \tau_{cr}\,D\,t_w .
  $$

  $k_v$ depends on aspect ratio and boundary conditions; AASHTO tabulates the resulting **C** expressions, including tension-field action eligibility and proportional limits. ([American Institute of Steel Construction][3])

* **End panel** (adjacent to a girder end): *no* tension field; limit to yield or elastic buckling:

  $$
  V_n \;=\; \min\{V_p,\;V_{cr}\} \;=\; C\,V_p .
  $$

  Check end-panel stiffener spacing limits (≤ 1.5D to qualify). ([American Institute of Steel Construction][4])

> Practical workflow: compute the panel classification (stiffened vs unstiffened), evaluate eligibility for post-buckling (tension-field) action via AASHTO’s proportional limit, then assemble $V_n$. Apply $ϕ_v=1.00$ and compare to $\sum \eta_i \gamma_i V_i$ at Strength I. ([Federal Highway Administration][2])

**Pseudocode sketch**

```pseudo
function web_shear_capacity(panel):
  Vp = 0.58*Fy_web*D*tw
  kv = kv_from_geometry(panel)           // AASHTO table
  tau_cr = kv * (pi^2*E/(12*(1-ν^2))) * (tw/D)^2
  Vcr = tau_cr * D * tw
  C = Vcr / Vp
  if panel.is_end: C = min(C, 1.0)       // no tension field beyond yield
  if not eligible_for_tension_field(panel): C = min(C, 1.0)
  Vn = C * Vp
  Vr = 1.0 * Vn
  return Vr
```

---

## Bearing & web checks at reactions (yielding/crippling) — coding the ugly bits

For deteriorated or thin webs at supports, LRFD requires **bearing** checks. MassDOT additionally prescribes explicit **web local yielding** and **web local crippling** formulas keyed to the **average remaining** web thickness in the bottom 4 in. (good for rating and rehab codepaths).

Let $t_{ave}$ be the *average* remaining web thickness over the bottom 4 in, accounting for holes (holes are taken as ineffective over that height). Define: bearing length $N$; fillet distance $k$; flange thickness $t_f$; total depth $d$; hole length along the bearing zone $H$; steel $E,F_y$.

**Web local yielding** (no stiffeners):

* If interior reaction or end reaction with overhang ≥ $5k$:

  $$
  R_{n,\text{yield}} \;=\; F_y\, t_{ave}\,(N+5k)
  $$
* If end reaction with overhang < $5k$:

  $$
  R_{n,\text{yield}} \;=\; F_y\, t_{ave}\,(N+2.5k)
  $$

**Web local crippling**:

* If interior reaction or end reaction ≥ $d/2$ from the member end,

  $$
  R_{n,\text{crip}} \;=\; 0.8\, t_{ave}^{2}\!\left[1+3\frac{(N-H)}{d}\right]
                       \!\left(\frac{t_{ave}}{t_f}\right)^{1.5}\!
                       \frac{E\,F_y\,t_f}{t_{ave}}
  $$
* Otherwise use the $0.4(\cdots)$ form with a piecewise modifier for $N/d>0.2$ as given in the spec excerpt.
  Factored resistance for LRFD:

$$
R_{fact}=\min\{\phi_b R_{n,\text{yield}},\,\phi_w R_{n,\text{crip}}\},\quad
\phi_b=1.0,\;\phi_w=0.8.
$$

Use this in the usual Strength I rating/check equation.  &#x20;

**Pseudocode**

```pseudo
function support_web_capacity(E, Fy, tf, d, N, k, H, t_ave, location):
  Rn_y = Fy * t_ave * (N + (location.has_overhang_ge_5k ? 5*k : 2.5*k))
  Rn_c = crippling_formula(E,Fy,tf,d,N,H,t_ave,location)   // piecewise above
  Rfact = min(1.0*Rn_y, 0.8*Rn_c)
  return Rfact
```

If **bearing stiffeners** are present, treat the effective column as the stiffeners plus web strip of length $N+5k$ (or $N+2.5k$), and compute bearing capacity per LRFD’s stiffener/column logic rather than the bare-web formulas. (MassDOT notes the effective area composition explicitly.)&#x20;

---

## Putting it together (capacity side only)

At any section $x$, compute the factored resistances $M_r(x)$, $V_r(x)$, and (where governing) $R_{fact}(x)$ for bearing/crippling. Then your LRFD check is the standard:

$$
\eta_i\gamma_i Q_i \;\le\; R_r
$$

for each limit state, with $\sum \eta_i\gamma_i M_i \le M_r$, $\sum \eta_i\gamma_i V_i \le V_r$, etc. (ϕ already embedded in $R_r$). FHWA’s worked girder example illustrates the exact assembly and confirms $\phi_v=1.00$ for shear. ([Federal Highway Administration][2])

---

## Quick implementation notes

* Use the **Appendix A6** (moment-format) equations for straight, compact or nearly-compact webs: they map cleanly to code and avoid stress-format bookkeeping; default to Article 6.10.8.2 for slender-web or curved/kinked cases. ([American Institute of Steel Construction][1])
* For shear panels, encapsulate the **eligibility for tension-field action** and **end-panel limits** as explicit booleans; drive $C$ selection from a small strategy table keyed by panel type and aspect ratio. ([American Institute of Steel Construction][3])
* For rehab/rating, keep the **corroded web** checks modular; they tie directly into your reaction inventory and are independent of global flexure.&#x20;

---

## Minimal API surface (drop-in)

```pseudo
// Flexure (LRFD)
FlexResult flex_capacity(section, Lb, Cb, flags)

// Shear by panel
ShearResult shear_capacity(panel_geom, material, panel_type, end_panel)

// Support checks
BearResult support_web_capacity(E,Fy,tf,d,N,k,H,t_ave,location, has_stiffener)

// Assembled resistance at a section
Resist section_resistance(x) = { Mr, Vr, Rbear? }
```

---

### Sources & further reading

* NSBA / FHWA, **Steel Bridge Design Handbook**, esp. Chapter 4 (AASHTO 2020 LTB/FLB/TFY anchor-point method; Appendix A6 guidance; Cb application). ([American Institute of Steel Construction][1])
* FHWA, **LRFD Steel Girder Superstructure Design Example** (ϕ factors; shear panel design workflow; end-panel constraints). ([Federal Highway Administration][2])
* NSBA Handbook Appendix design examples — **Shear of plate girder webs** (explicit $V_n=C V_p$, $V_p=0.58\,F_{yw}Dt_w$, tension-field proportional limits). ([American Institute of Steel Construction][3])
* MassDOT **LRFD Bridge Manual, Part I, Ch. 7** — **web local yielding/crippling** formulas in rating (useful for rehab/rating codepaths).  &#x20;

If you want, I can turn this into a tiny Python module with `ltb.py`, `shear.py`, and `bearing.py`, wired to unit tests that reproduce the handbook examples numerically.

[1]: https://www.aisc.org/globalassets/nsba/design-resources/steel-bridge-design-handbook/b904_sbdh_chapter4.pdf "Steel Bridge Design Handbook"
[2]: https://www.fhwa.dot.gov/bridge/lrfd/us_ds3.cfm "LRFD Steel Girder SuperStructure Design Example - LRFD - Structures - Bridges & Structures - 
Federal Highway Administration"
[3]: https://www.aisc.org/globalassets/nsba/design-resources/steel-bridge-design-handbook/b954_sbdh_appendix3.pdf?utm_source=chatgpt.com "Design Example 3: Three-Span Continuous Horizontally ..."
[4]: https://www.aisc.org/globalassets/nsba/design-resources/steel-bridge-design-handbook/b955_sbdh_appendix4.pdf?utm_source=chatgpt.com "Three-Span Continuous Straight Composite Steel Tub ..."
