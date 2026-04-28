export const modalCopy = {
  en: `
    <h3>The Hessian Matrix</h3>
    <p>For a smooth function $f(x, y)$, the Hessian $H$ encodes the second-order derivative information at a point:</p>
    <p>$$H = \\begin{bmatrix} f_{xx} & f_{xy} \\\\ f_{yx} & f_{yy} \\end{bmatrix}$$</p>
    <p>Because $f_{xy} = f_{yx}$ (Schwarz's theorem), $H$ is always <strong>symmetric</strong> — it has real eigenvalues and orthogonal eigenvectors.</p>

    <h3>What Each Entry Means</h3>
    <ul>
      <li>$f_{xx}$: second derivative along $x$ — positive = concave up (bowl), negative = concave down</li>
      <li>$f_{yy}$: second derivative along $y$</li>
      <li>$f_{xy}$: mixed partial derivative — how the slope in $x$ changes as you move along $y$</li>
    </ul>

    <h3>Classifying Critical Points</h3>
    <p>At a critical point where $\\nabla f = 0$, the Hessian determines the terrain type:</p>
    <ul>
      <li><span style="color:#A3BE8C"><strong>Positive Definite</strong></span> — $\\det H > 0$, $f_{xx} > 0$: local minimum, bowl shape</li>
      <li><span style="color:#BF616A"><strong>Negative Definite</strong></span> — $\\det H > 0$, $f_{xx} < 0$: local maximum, inverted bowl</li>
      <li><span style="color:#EBCB8B"><strong>Indefinite</strong></span> — $\\det H < 0$: saddle point — stable one way, unstable the other</li>
    </ul>

    <h3>Eigenvalues — Principal Bending Directions</h3>
    <p>The eigenvalues $\\lambda_1 \\geq \\lambda_2$ of $H$ describe the strength of second-order bending in the eigenvector directions. In this quadratic model, those eigenvectors point along the maximum and minimum bending directions:</p>
    <p>$$\\lambda_{1,2} = \\frac{(f_{xx}+f_{yy}) \\pm \\sqrt{(f_{xx}-f_{yy})^2 + 4f_{xy}^2}}{2}$$</p>
    <p>Drop a ball at a saddle point: the positive-$\\lambda$ axis acts like a bowl (ball returns), the negative-$\\lambda$ axis acts like a hill (ball escapes). <em>The eigenvectors are the paths the ball most wants to roll.</em></p>

    <h3>① Terrain Scanner — First vs. Second Order</h3>
    <p>This tab shows three canonical surfaces and lets you feel the difference between first-order and second-order information:</p>
    <ul>
      <li><strong>Bowl</strong> $z = x^2 + y^2$: $H = 2I$, positive definite everywhere. Every point is a local bowl; the gradient always points uphill toward the rim.</li>
      <li><strong>Bell</strong> $z = e^{-(x^2+y^2)}$: $H$ is positive definite away from the peak, but <em>zero</em> at the summit — the gradient vanishes and the Hessian alone decides you're at a maximum.</li>
      <li><strong>Saddle</strong> $z = x^2 - y^2$: $H = \\begin{bmatrix}2&0\\\\0&-2\\end{bmatrix}$, indefinite. The gradient at the origin is zero, yet it is <em>not</em> an extremum.</li>
    </ul>
    <p>The yellow arrow (gradient $\\nabla f$) tells you the steepest direction <em>right now</em>. The teal plane (tangent plane) is the first-order approximation. The Hessian describes how that plane tilts as you move — information the gradient alone cannot provide.</p>

    <h3>② Shape Shifter — Sculpting Curvature</h3>
    <p>The surface displayed is the exact second-order Taylor expansion centered at the origin:</p>
    <p>$$f(x,y) \\approx \\tfrac{1}{2}\\bigl(f_{xx}\\,x^2 + 2f_{xy}\\,xy + f_{yy}\\,y^2\\bigr)$$</p>
    <p>Dragging the sliders directly edits the three independent entries of $H$. Key observations:</p>
    <ul>
      <li>$f_{xx}$ and $f_{yy}$ independently control curvature along the coordinate axes. Equal positive values → circular bowl; unequal → elliptic bowl.</li>
      <li>$f_{xy}$ <em>rotates</em> the principal axes without changing the eigenvalues. Watch how the bowl twists diagonally as $f_{xy}$ grows — the matrix frame changes, but the intrinsic shape is governed by $\\lambda_1, \\lambda_2$.</li>
      <li>The gold ball rolls down $-\\nabla f = -(f_{xx}x + f_{xy}y,\\; f_{xy}x + f_{yy}y)$. Positive definite → ball spirals to the minimum. Indefinite → ball escapes along the unstable eigenvector.</li>
      <li>The matrix border colour is a live definiteness indicator: <span style="color:#A3BE8C">green = PD</span>, <span style="color:#BF616A">red = ND</span>, <span style="color:#EBCB8B">yellow = indefinite</span>.</li>
    </ul>

    <h3>③ Curvature Ellipse — Seeing Eigenstructure</h3>
    <p>This tab shows the <em>level curve</em> $f(x,y) = c$ for $c = 2$, which is the set of points at equal "height" on the quadratic surface. For a positive definite $H$ this curve is an ellipse; for indefinite $H$ it becomes a hyperbola.</p>
    <p>The semi-axis lengths of the ellipse are directly related to the eigenvalues:</p>
    <p>$$a = \\sqrt{\\frac{2c}{\\lambda_1}}, \\quad b = \\sqrt{\\frac{2c}{\\lambda_2}}$$</p>
    <p>A <em>larger</em> eigenvalue means <em>more</em> curvature in that direction, so the ellipse is <em>narrower</em> along the corresponding eigenvector. The two arrow axes are the eigenvectors — they are always perpendicular regardless of $f_{xy}$, because $H$ is symmetric.</p>
    <p>Try this: set $f_{xx} = f_{yy} = 1$, $f_{xy} = 0$ → circle. Now increase $f_{xy}$ → the circle stays a circle (eigenvalues unchanged) but the axes rotate. Then set $f_{xx} = 2$, $f_{yy} = 0.5$ → ellipse with axes aligned. Add $f_{xy}$ → the ellipse rotates.</p>

    <h3>④ Saddle Point — Why Hessian Matters in Optimization</h3>
    <p>The saddle surface $z = x^2 - y^2$ has $\\nabla f = 0$ at the origin — a critical point. Yet a gradient-descent optimizer would get <em>stuck</em> here, mistaking it for a minimum.</p>
    <p>The Hessian immediately reveals the problem: $H = \\begin{bmatrix}2&0\\\\0&-2\\end{bmatrix}$, with $\\det H = -4 < 0$ — indefinite. Eigenvalues $+2$ and $-2$ coexist.</p>
    <ul>
      <li><span style="color:#A3BE8C"><strong>Along the $x$-axis</strong></span> (green arrow, $\\lambda = +2$): the surface curves upward. A ball placed here rolls <em>back</em> to the origin — locally stable.</li>
      <li><span style="color:#BF616A"><strong>Along the $y$-axis</strong></span> (red arrow, $\\lambda = -2$): the surface curves downward. A ball rolls <em>away</em> — unstable.</li>
    </ul>
    <p>This is the core reason modern optimizers (Adam, L-BFGS) use Hessian information or its approximation: gradient alone cannot distinguish a minimum from a saddle point. The Hessian's eigenvalue signature — all positive, all negative, or mixed — makes the classification unambiguous.</p>
  `,
  zhTW: `
    <h3>Hessian 矩陣（海森矩陣）</h3>
    <p>對於光滑函數 $f(x, y)$，Hessian 矩陣 $H$ 描述某一點的二階偏導資訊：</p>
    <p>$$H = \\begin{bmatrix} f_{xx} & f_{xy} \\\\ f_{yx} & f_{yy} \\end{bmatrix}$$</p>
    <p>由 Schwarz 定理，$f_{xy} = f_{yx}$，所以 $H$ 永遠是<strong>實對稱矩陣</strong>——特徵值皆為實數，特徵向量互相垂直。</p>

    <h3>各元素的物理意義</h3>
    <ul>
      <li>$f_{xx}$：沿 $x$ 軸的二階偏導數；正值代表向上彎（碗狀），負值代表向下彎</li>
      <li>$f_{yy}$：沿 $y$ 軸的二階偏導數</li>
      <li>$f_{xy}$：混合偏導數，描述你沿 $y$ 移動時，$x$ 方向斜率如何改變</li>
    </ul>

    <h3>臨界點的判別</h3>
    <p>在 $\\nabla f = 0$ 的臨界點，Hessian 決定地形的「形狀」：</p>
    <ul>
      <li><span style="color:#A3BE8C"><strong>正定（Positive Definite）</strong></span>：局部極小值，碗狀地形，穩定</li>
      <li><span style="color:#BF616A"><strong>負定（Negative Definite）</strong></span>：局部極大值，倒扣的碗，不穩定</li>
      <li><span style="color:#EBCB8B"><strong>不定（Indefinite）</strong></span>：鞍點——一個方向穩定、另一方向不穩定</li>
    </ul>

    <h3>特徵值——主彎曲方向與強度</h3>
    <p>$H$ 的特徵值 $\\lambda_1 \\geq \\lambda_2$ 描述二階變化的強弱；對應的特徵向量則指向彎曲最劇烈與最平緩的方向。在這個二次近似模型中，這些方向就是主方向：</p>
    <p>$$\\lambda_{1,2} = \\frac{(f_{xx}+f_{yy}) \\pm \\sqrt{(f_{xx}-f_{yy})^2 + 4f_{xy}^2}}{2}$$</p>
    <p>把球放在鞍點：$\\lambda > 0$ 的方向像碗，球會被拉回；$\\lambda < 0$ 的方向像山坡，球順勢滾走。<em>特徵向量就是「球最想滾動的路徑」。</em></p>

    <h3>① Terrain Scanner — 一階 vs 二階資訊</h3>
    <p>這個分頁展示三種標準曲面，讓你感受梯度（一階）與 Hessian（二階）各自提供的資訊：</p>
    <ul>
      <li><strong>碗形（Bowl）</strong> $z = x^2 + y^2$：$H = 2I$，處處正定。每個點都是局部最小值，梯度永遠指向上坡方向。</li>
      <li><strong>鐘形（Bell）</strong> $z = e^{-(x^2+y^2)}$：遠離頂點時正定，但在頂點本身梯度為零、$H$ 為負定——唯有 Hessian 能告訴你「這是極大值」。</li>
      <li><strong>鞍形（Saddle）</strong> $z = x^2 - y^2$：$H = \\begin{bmatrix}2&0\\\\0&-2\\end{bmatrix}$，不定。原點梯度為零，卻不是極值——靠梯度根本無法判斷。</li>
    </ul>
    <p>黃色箭頭（梯度 $\\nabla f$）代表「現在最陡的方向」。藍色平面（切平面）是一階近似。Hessian 描述的是：當你移動時，這個切平面如何傾斜——這是梯度無法回答的問題。</p>

    <h3>② Shape Shifter — 親手塑造曲率</h3>
    <p>畫面上的曲面就是以原點為中心的二階 Taylor 展開：</p>
    <p>$$f(x,y) \\approx \\tfrac{1}{2}\\bigl(f_{xx}\\,x^2 + 2f_{xy}\\,xy + f_{yy}\\,y^2\\bigr)$$</p>
    <p>拉動滑桿等同於直接編輯 $H$ 的三個獨立元素。幾個關鍵直覺：</p>
    <ul>
      <li>$f_{xx}$ 和 $f_{yy}$ 分別控制座標軸方向的彎曲度。兩者相等為圓形碗；不相等為橢圓碗。</li>
      <li>$f_{xy}$ 會<em>旋轉</em>主軸方向，但不改變特徵值本身。觀察碗如何對角扭曲——矩陣的「框架」在旋轉，內在形狀由 $\\lambda_1, \\lambda_2$ 決定。</li>
      <li>金色小球沿 $-\\nabla f = -(f_{xx}x + f_{xy}y,\\; f_{xy}x + f_{yy}y)$ 滾動。正定 → 螺旋收斂到極小值；不定 → 沿不穩定特徵向量方向逃逸。</li>
      <li>矩陣外框顏色是即時正定性指示器：<span style="color:#A3BE8C">綠色 = 正定</span>、<span style="color:#BF616A">紅色 = 負定</span>、<span style="color:#EBCB8B">黃色 = 不定</span>。</li>
    </ul>

    <h3>③ Curvature Ellipse — 看見特徵結構</h3>
    <p>這個分頁顯示<em>等高線</em> $f(x,y) = c$（$c=2$），也就是二次曲面上等高度的點集。正定時為橢圓，不定時退化為雙曲線。</p>
    <p>橢圓的半軸長度與特徵值直接相關：</p>
    <p>$$a = \\sqrt{\\frac{2c}{\\lambda_1}}, \\quad b = \\sqrt{\\frac{2c}{\\lambda_2}}$$</p>
    <p>特徵值<em>越大</em>代表該方向曲率<em>越強</em>，橢圓在對應特徵向量方向上反而<em>越窄</em>。兩條箭頭軸就是特徵向量——無論 $f_{xy}$ 如何改變，它們永遠垂直，因為 $H$ 是對稱矩陣。</p>
    <p>試試這個：設 $f_{xx} = f_{yy} = 1$，$f_{xy} = 0$ → 圓形。增加 $f_{xy}$ → 仍是圓形（特徵值不變），但軸旋轉了。再設 $f_{xx} = 2$，$f_{yy} = 0.5$ → 橢圓軸對齊座標軸。加入 $f_{xy}$ → 橢圓整體旋轉。</p>

    <h3>④ Saddle Point — Hessian 在最佳化中的核心價值</h3>
    <p>鞍面 $z = x^2 - y^2$ 在原點的梯度為零，是一個臨界點。若用梯度下降法，優化器會在此<em>卡住</em>，誤以為找到了極小值。</p>
    <p>Hessian 立刻揭穿問題：$H = \\begin{bmatrix}2&0\\\\0&-2\\end{bmatrix}$，$\\det H = -4 < 0$——不定矩陣，特徵值一正一負。</p>
    <ul>
      <li><span style="color:#A3BE8C"><strong>沿 $x$ 軸方向</strong></span>（綠色箭頭，$\\lambda = +2$）：曲面向上彎，球會滾回原點——局部穩定。</li>
      <li><span style="color:#BF616A"><strong>沿 $y$ 軸方向</strong></span>（紅色箭頭，$\\lambda = -2$）：曲面向下彎，球往外逃——不穩定。</li>
    </ul>
    <p>這正是現代優化器（Adam、L-BFGS）引入 Hessian 或其近似的根本原因：梯度資訊無法區分極小值與鞍點。Hessian 的特徵值符號組合——全正、全負、或正負混合——讓分類變得明確無爭議。</p>
  `,
};
