# Part 24 — Reinforcement Learning

<!-- nav -->
> [!example] 🧭 Step 23 of 26 · Stage 6 of 7: Modern AI
> ← [Part 23 · Generative models](23_Generative_Models_Autoencoders_GANs_Diffusion.md) · [Part 25 · SOTA roadmap](25_State_of_the_Art_and_Learning_Roadmap.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 19** "Reinforcement Learning". **🔭 State of the art** boxes cover 2025–26: RL is now the engine behind **LLM alignment and reasoning models** (RLHF, DPO, GRPO), and the simpler cousin of RL — **contextual bandits** — is what telecoms actually deploy for offers and pricing.

**Why a data scientist at e& should care (even if you never train a robot):**

| Where RL shows up | What it looks like at a telco |
|---|---|
| **Bandits / next-best-offer** | Choose which bundle to push to each subscriber in the app, learn from accept/ignore |
| **Sequential decisions** | Retention journeys: when to call, which discount, how often, without annoying the customer |
| **Network optimisation** | Cell sleep modes for energy saving, RAN parameter tuning, traffic steering (O-RAN "xApps") |
| **LLMs** | Every chat model you use was tuned with RL (RLHF / GRPO) — see Part 21 |

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Rarely a core requirement for DS roles, but bandits (offers) and RLHF (LLMs) come up, and telecoms use RL for network optimisation.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | The agent–environment–reward loop; exploration vs exploitation; how RL differs from supervised learning. |
> | 🟡 **Mid** | Bandits (ε-greedy, UCB, Thompson) vs A/B tests; Q-learning in one line; on- vs off-policy; RLHF/GRPO at a high level. |
> | 🔴 **Senior** | DQN/PPO details, offline RL and off-policy evaluation, reward design and safety for production RL. |
>
> **⭐ Most-asked:** *How is RL different from supervised learning?* · *Explore vs exploit — how do bandits handle it?* · *Bandit vs A/B test for offers?* · *What is RLHF?* · *When would you *not* use RL?*
>
> **⏱ Time:** 2 h (entry/mid), 5 h (to master)  ·  **Short on time?** Read §24.1, §24.4, §24.12 (bandits + RLHF), §24.14.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 24.1 | What is RL? The vocabulary | 🟡 ⭐ | Ch. 19 · pp. 742–744 |
> | 24.2 | Policy search | 🔴 | Ch. 19 · pp. 744–749 |
> | 24.3 | Neural-network policies | 🔴 | Ch. 19 · pp. 749–752 |
> | 24.4 | The credit-assignment problem, returns and discounting | 🟡 | Ch. 19 · pp. 752–753 |
> | 24.5 | Policy gradients: the REINFORCE algorithm (Williams, 1992) | 🔴 | Ch. 19 · pp. 753–756 |
> | 24.6 | Markov Decision Processes (MDPs) and value-based methods | 🔴 | Ch. 19 · pp. 756–761 |
> | 24.7 | Temporal Difference learning and Q-learning (model-free) | 🟡 | Ch. 19 · pp. 761–765 |
> | 24.8 | Deep Q-Learning (DQN) | 🔴 | Ch. 19 · pp. 765–773 |
> | 24.9 | Actor-critic methods | 🔴 | Ch. 19 · pp. 773–778 |
> | 24.10 | Mastering Atari Breakout with Stable-Baselines3 PPO | 🔴 | Ch. 19 · pp. 778–782 |
> | 24.11 | The wider RL landscape | 🔴 | Ch. 19 · pp. 782–785 |
> | 24.12 | 🔭 State of the art (2025–26) | 🟡 ⭐ | — |
> | 24.13 | Real-world examples | 🟡 | — |
> | 24.14 | Interview drill — reinforcement learning | 🟡 | Ch. 19 · p. 785 |
>

---

## 24.1 What is RL? The vocabulary 🟡 ⭐

> [!info] 📖 Géron Ch. 19 · “What Is Reinforcement Learning?” · pp. 742–744

![The reinforcement-learning loop.](figures/fig24_rl_loop.png)
*The reinforcement-learning loop.*

> [!quote] 💬 Say it in the interview
> “In RL an agent learns a policy from rewards by interacting with an environment. Unlike supervised learning, the feedback is delayed and its own actions change the data it sees.”

An **agent** observes a **state** (observation) of an **environment**, takes an **action**, and receives a **reward**. Its goal: learn a **policy** (a mapping state → action) that maximises the **expected cumulative reward** over time.

```
          ┌──────────── action a_t ────────────┐
          │                                    ▼
      ┌───────┐                          ┌─────────────┐
      │ Agent │ ◄── state s_{t+1}, ───── │ Environment │
      └───────┘     reward r_{t+1}       └─────────────┘
```

**How it differs from supervised learning** (a classic interview question):

| | Supervised | Reinforcement |
|---|---|---|
| Feedback | Correct label for every example | A **scalar reward**, often **delayed** and **sparse** |
| Data | Fixed i.i.d. dataset | The agent's **own actions change the data** it sees |
| Core tension | Bias–variance | **Exploration vs exploitation** |
| Goal | Minimise prediction error | Maximise long-run return |

**Géron's examples of agents:** a robot (reward for reaching a target, penalty for wasting time), a Ms. Pac-Man player (points), a Go player (win/lose), a smart thermostat (reward for hitting the target temperature cheaply), an automatic trader.

**Milestones worth knowing by name:**
- **2013 — DeepMind DQN** learns dozens of **Atari** games from raw pixels.
- **2016 — AlphaGo** beats Lee Sedol at Go; **2017 — AlphaZero** masters Go, chess and shogi by self-play; **2019 — MuZero** does it *without knowing the rules*.
- **2019 — OpenAI Five** (PPO) beats Dota 2 world champions; **AlphaStar** reaches Grandmaster in StarCraft II.
- **2022 — ChatGPT**: RLHF turns a pretrained LLM into an assistant.
- **2024 — Nobel Prize in Chemistry** to Hassabis & Jumper for **AlphaFold** (not RL itself, but from the same DeepMind lineage). **AlphaCode**, **AlphaDev** (faster sorting routines found by RL, merged into LLVM's libc++), **GNoME** (2.2M new crystal structures).
- **2024–25 — reasoning models** (OpenAI o1/o3, **DeepSeek-R1**) trained with large-scale RL on verifiable rewards (maths answers, passing unit tests).

---

## 24.2 Policy search 🔴

> [!info] 📖 Géron Ch. 19 · “Policy Gradients”, “Introduction to the Gymnasium Library” · pp. 744–749

The policy can be anything: a hard-coded rule, a neural network, a lookup table. It can be **deterministic** or **stochastic** (outputs a probability per action).

Ways to find a good policy:
1. **Brute force** over policy parameters — only for tiny spaces.
2. **Genetic algorithms** — make 100 random policies, keep the best 20, produce offspring by copying + random mutation, repeat.
3. **Policy gradients (PG)** — use gradient ascent on the parameters to increase the expected reward. This is the path to modern deep RL.

### Gymnasium: the standard RL toolkit

Gymnasium (the maintained fork of OpenAI Gym, by the Farama Foundation) gives a uniform API to hundreds of environments.

```python
import gymnasium as gym
env = gym.make("CartPole-v1", render_mode="rgb_array")
obs, info = env.reset(seed=42)
# obs = [cart position, cart velocity, pole angle, pole angular velocity]
env.action_space          # Discrete(2): 0 = push left, 1 = push right
obs, reward, done, truncated, info = env.step(1)
```

- `done` = the episode ended naturally (pole fell / cart left the track).
- `truncated` = cut off by a time limit (CartPole-v1 truncates after 500 steps; Géron's version allows up to **1,000**). **Treat them differently when computing targets** — a truncated episode is *not* a real terminal state (see DQN below).
- Reward: +1 per step the pole stays up.

**A hard-coded baseline** — push in the direction the pole leans:

```python
def basic_policy(obs):
    angle = obs[2]
    return 0 if angle < 0 else 1
```

Averaged over 500 episodes: **mean ≈ 41.7 steps**, max ≈ 63. The pole wobbles more and more and falls. Always build a baseline like this first — the same discipline as a naive forecast in Part 19.

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="A genetic algorithm on CartPole: in generation 0 most random linear policies fall within a few dozen steps; after keeping the best 20 and mutating them for seven generations most policies balance the pole for the full 500 steps, far above the hard-coded baseline of 41.7 steps">
<line class="sLm" x1="66" y1="206" x2="520" y2="206"/><line class="sLm" x1="66" y1="206" x2="66" y2="26"/>
<text class="sS" x="58" y="210" text-anchor="end">0</text><line class="sLm" x1="66" y1="206" x2="520" y2="206" opacity=".15"/>
<text class="sS" x="58" y="175.2" text-anchor="end">100</text><line class="sLm" x1="66" y1="171.2" x2="520" y2="171.2" opacity=".15"/>
<text class="sS" x="58" y="140.4" text-anchor="end">200</text><line class="sLm" x1="66" y1="136.4" x2="520" y2="136.4" opacity=".15"/>
<text class="sS" x="58" y="105.6" text-anchor="end">300</text><line class="sLm" x1="66" y1="101.6" x2="520" y2="101.6" opacity=".15"/>
<text class="sS" x="58" y="70.8" text-anchor="end">400</text><line class="sLm" x1="66" y1="66.8" x2="520" y2="66.8" opacity=".15"/>
<text class="sS" x="58" y="36" text-anchor="end">500</text><line class="sLm" x1="66" y1="32" x2="520" y2="32" opacity=".15"/>
<text class="sS" x="20" y="116" text-anchor="middle" transform="rotate(-90 20 116)">steps balanced</text>
<text class="sS" x="92" y="222" text-anchor="middle">0</text>
<circle class="sPv" cx="92.4" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="106.4" cy="142.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="80.6" cy="148.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="106.4" cy="176.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="86.0" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="89.5" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.5" cy="192.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="89.1" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="93.6" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="76.9" cy="176.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="100.1" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="93.2" cy="197.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="86.6" cy="189.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="101.2" cy="194.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="85.7" cy="198.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="90.5" cy="161.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="80.3" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="88.9" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="82.5" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="84.4" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="100.0" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="85.0" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="91.5" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="107.4" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="106.8" cy="203.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="99.2" cy="190.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="93.3" cy="127.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="84.9" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="81.1" cy="173.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="107.0" cy="181.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="92.5" cy="191.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="79.7" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="96.0" cy="39.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="100.9" cy="143.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="95.6" cy="177.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="105.4" cy="188.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="77.3" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="92.9" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="90.7" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="78.0" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="96.5" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="103.3" cy="175.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="95.0" cy="189.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="84.3" cy="172.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.9" cy="170.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="92.3" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="92.3" cy="203.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="100.1" cy="164.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="80.7" cy="192.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.2" cy="188.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="97.9" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="101.2" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="82.1" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="101.7" cy="202.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="82.1" cy="164.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="78.6" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="103.4" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="103.6" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="104.0" cy="176.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="91.1" cy="188.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="84.8" cy="197.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="76.2" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="96.7" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="99.0" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.7" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="85.0" cy="152.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="82.9" cy="192.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="96.5" cy="183.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="101.8" cy="180.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="106.8" cy="78.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="80.8" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="91.4" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="104.6" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="89.5" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="94.9" cy="175.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="76.8" cy="192.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="97.6" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="105.4" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.5" cy="179.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="104.3" cy="187.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="97.1" cy="77.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="83.9" cy="95.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="100.6" cy="192.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="82.8" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.6" cy="144.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="78.0" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="102.4" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="81.3" cy="203.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="88.0" cy="198.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="86.1" cy="126.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="98.1" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="81.7" cy="104.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="88.7" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="76.2" cy="203.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="84.4" cy="203.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="89.5" cy="191.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="79.4" cy="66.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="96.3" cy="187.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="88.2" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="99.2" cy="104.7" r="2.2" opacity=".7"/>
<text class="sS" x="148" y="222" text-anchor="middle">1</text>
<circle class="sPv" cx="152.9" cy="123.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="145.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="159.8" cy="158.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="152.2" cy="104.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="157.9" cy="154.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="142.9" cy="181.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="149.4" cy="49.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="138.3" cy="64.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="163.9" cy="165.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="139.8" cy="175.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="140.2" cy="152.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="134.3" cy="158.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="140.2" cy="160.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="156.4" cy="166.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="154.3" cy="122.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="136.1" cy="168.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.0" cy="59.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="145.5" cy="159.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="153.3" cy="49.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="146.6" cy="151.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="150.8" cy="110.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="158.9" cy="63.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="155.2" cy="157.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="143.7" cy="124.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="146.3" cy="114.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="143.8" cy="168.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="135.5" cy="178.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="138.5" cy="76.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="141.1" cy="91.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="142.1" cy="169.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="142.0" cy="36.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="150.5" cy="44.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="163.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="156.8" cy="104.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="157.3" cy="202.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="156.3" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="151.1" cy="35.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="161.4" cy="154.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="154.1" cy="119.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="148.0" cy="166.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="134.5" cy="196.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="147.6" cy="202.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="138.8" cy="98.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="136.2" cy="167.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="148.2" cy="142.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="157.1" cy="33.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="141.4" cy="83.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="156.6" cy="76.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="148.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="136.8" cy="196.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="162.9" cy="36.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.9" cy="174.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="141.4" cy="183.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="159.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="136.0" cy="156.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="155.5" cy="138.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="138.0" cy="173.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.6" cy="111.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="139.4" cy="194.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="158.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.5" cy="135.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="163.2" cy="38.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="152.0" cy="53.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="154.2" cy="161.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="148.7" cy="140.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="141.9" cy="159.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.7" cy="139.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="162.1" cy="74.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="138.4" cy="123.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="163.6" cy="163.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="156.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="143.5" cy="155.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="152.5" cy="53.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.2" cy="160.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="144.2" cy="59.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="148.1" cy="188.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="132.5" cy="179.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="147.8" cy="149.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="163.1" cy="161.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="141.1" cy="61.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="155.9" cy="35.6" r="2.2" opacity=".7"/>
<circle class="sPg" cx="146.2" cy="47.1" r="2.2" opacity=".7"/>
<circle class="sPg" cx="138.7" cy="55.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="161.0" cy="70.8" r="2.2" opacity=".7"/>
<circle class="sPg" cx="132.5" cy="81.3" r="2.2" opacity=".7"/>
<circle class="sPg" cx="141.7" cy="51.8" r="2.2" opacity=".7"/>
<circle class="sPg" cx="164.0" cy="89.4" r="2.2" opacity=".7"/>
<circle class="sPg" cx="140.4" cy="105.8" r="2.2" opacity=".7"/>
<circle class="sPg" cx="159.2" cy="112.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="151.4" cy="127.4" r="2.2" opacity=".7"/>
<circle class="sPg" cx="157.8" cy="131.9" r="2.2" opacity=".7"/>
<circle class="sPg" cx="152.2" cy="133.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="143.6" cy="125.3" r="2.2" opacity=".7"/>
<circle class="sPg" cx="156.3" cy="155.3" r="2.2" opacity=".7"/>
<circle class="sPg" cx="132.8" cy="157.1" r="2.2" opacity=".7"/>
<circle class="sPg" cx="146.3" cy="155.5" r="2.2" opacity=".7"/>
<circle class="sPg" cx="143.9" cy="162.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="147.3" cy="164.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="136.1" cy="164.8" r="2.2" opacity=".7"/>
<circle class="sPg" cx="139.1" cy="169.5" r="2.2" opacity=".7"/>
<text class="sS" x="204" y="222" text-anchor="middle">2</text>
<circle class="sPv" cx="206.0" cy="130.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="200.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="213.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.4" cy="38.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="215.6" cy="35.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="211.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.3" cy="92.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="197.2" cy="56.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="213.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="196.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="190.4" cy="43.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="205.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="212.8" cy="77.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="204.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="189.1" cy="152.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="194.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="209.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="206.3" cy="132.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="193.1" cy="194.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="192.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="204.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="192.6" cy="76.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="211.0" cy="42.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="196.8" cy="124.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="192.3" cy="176.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="189.5" cy="146.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="193.6" cy="34.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="194.1" cy="71.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="205.2" cy="121.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="202.4" cy="83.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.6" cy="84.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.5" cy="138.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="213.5" cy="177.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="209.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="215.0" cy="63.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.0" cy="70.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="188.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.8" cy="62.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="199.5" cy="33.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.0" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.2" cy="62.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="196.3" cy="66.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="196.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="197.2" cy="188.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.1" cy="120.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="211.7" cy="84.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="208.8" cy="89.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.4" cy="103.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="189.1" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="201.7" cy="87.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="209.9" cy="76.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="193.0" cy="150.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="200.3" cy="202.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="188.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="190.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="194.9" cy="95.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="201.3" cy="85.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="202.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="216.3" cy="77.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="198.1" cy="41.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="188.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="214.4" cy="56.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="190.0" cy="81.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="218.8" cy="140.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="212.1" cy="44.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="198.8" cy="127.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="192.2" cy="101.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="200.4" cy="186.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="198.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="216.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="201.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="190.6" cy="97.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="217.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="207.9" cy="112.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.7" cy="114.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="191.6" cy="65.3" r="2.2" opacity=".7"/>
<circle class="sPg" cx="202.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="190.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="208.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="207.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="189.0" cy="33.6" r="2.2" opacity=".7"/>
<circle class="sPg" cx="213.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="213.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="217.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="209.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="210.2" cy="45.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="193.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="188.8" cy="35.1" r="2.2" opacity=".7"/>
<circle class="sPg" cx="190.1" cy="48.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="218.9" cy="72.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="208.7" cy="74.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="218.3" cy="53.6" r="2.2" opacity=".7"/>
<circle class="sPg" cx="199.2" cy="90.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="212.2" cy="63.5" r="2.2" opacity=".7"/>
<circle class="sPg" cx="190.1" cy="47.5" r="2.2" opacity=".7"/>
<circle class="sPg" cx="193.3" cy="75.6" r="2.2" opacity=".7"/>
<text class="sS" x="260" y="222" text-anchor="middle">3</text>
<circle class="sPv" cx="252.9" cy="140.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="261.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="261.8" cy="40.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="260.0" cy="146.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="257.6" cy="84.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="262.4" cy="107.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="274.9" cy="103.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="258.7" cy="33.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.8" cy="146.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.8" cy="119.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="256.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="261.9" cy="182.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="263.9" cy="150.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="252.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="256.8" cy="90.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="274.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="264.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="262.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="246.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.7" cy="105.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="250.8" cy="44.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="248.4" cy="97.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="275.5" cy="36.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="244.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="255.7" cy="72.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="264.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.5" cy="94.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="246.2" cy="34.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="246.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="252.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="262.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="269.8" cy="40.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="252.6" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="253.1" cy="87.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="267.9" cy="121.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="248.1" cy="43.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="269.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.6" cy="60.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="249.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="264.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="250.3" cy="96.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="251.8" cy="38.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="259.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="260.7" cy="183.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="259.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="261.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="250.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="268.9" cy="85.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="252.9" cy="46.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="273.2" cy="49.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="260.5" cy="36.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="253.7" cy="72.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="249.6" cy="34.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="259.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="256.0" cy="49.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="263.9" cy="51.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="260.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.2" cy="43.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.7" cy="199.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="245.7" cy="58.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.5" cy="88.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.0" cy="52.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="273.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="265.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="249.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="258.1" cy="84.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="258.1" cy="120.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="264.2" cy="140.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="256.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="265.6" cy="38.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="250.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="255.3" cy="89.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="261.4" cy="52.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="257.7" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="247.9" cy="113.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="274.9" cy="126.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="266.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="270.7" cy="56.8" r="2.2" opacity=".7"/>
<circle class="sPg" cx="255.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="274.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="270.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="275.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="250.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="259.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="256.3" cy="34.1" r="2.2" opacity=".7"/>
<circle class="sPg" cx="263.6" cy="34.6" r="2.2" opacity=".7"/>
<circle class="sPg" cx="252.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="247.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="259.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="264.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="256.3" cy="37.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="275.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="257.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="253.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="270.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="258.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="252.7" cy="34.3" r="2.2" opacity=".7"/>
<circle class="sPg" cx="253.2" cy="32.0" r="2.2" opacity=".7"/>
<text class="sS" x="316" y="222" text-anchor="middle">4</text>
<circle class="sPv" cx="330.3" cy="54.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="330.8" cy="90.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="320.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="308.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="322.8" cy="198.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="306.9" cy="66.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="310.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="317.3" cy="97.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="312.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="311.2" cy="47.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="331.2" cy="63.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="305.4" cy="93.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="319.6" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="301.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="302.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="306.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="331.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="323.2" cy="113.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="327.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="301.6" cy="141.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="321.8" cy="36.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="314.1" cy="80.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="313.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="322.7" cy="35.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="309.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="316.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="308.3" cy="42.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="312.5" cy="117.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="317.1" cy="36.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="305.1" cy="68.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="308.8" cy="44.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="313.5" cy="166.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="315.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="325.6" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="320.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="318.0" cy="142.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="327.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="306.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="303.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="312.6" cy="80.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="304.4" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="317.8" cy="68.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="318.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="304.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="322.9" cy="163.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="317.8" cy="93.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="313.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="329.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="327.4" cy="102.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="307.1" cy="185.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="305.3" cy="54.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="329.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="305.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="324.2" cy="148.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="310.0" cy="54.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="311.6" cy="32.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="317.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="329.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="300.1" cy="81.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="305.2" cy="82.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="323.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="312.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="309.2" cy="50.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="330.8" cy="103.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="308.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="322.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="330.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="324.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="322.7" cy="104.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="323.1" cy="107.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="325.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="308.7" cy="154.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="320.1" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="325.7" cy="100.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="328.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="329.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="328.9" cy="202.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="303.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="312.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="314.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="328.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="313.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="308.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="300.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="309.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="325.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="300.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="305.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="310.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="317.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="311.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="328.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="306.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="318.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="324.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="329.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="328.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="304.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="325.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="321.6" cy="32.0" r="2.2" opacity=".7"/>
<text class="sS" x="372" y="222" text-anchor="middle">5</text>
<circle class="sPv" cx="369.5" cy="54.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="356.8" cy="37.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="361.4" cy="59.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="380.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.7" cy="59.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="366.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="364.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="379.9" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="367.5" cy="155.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.8" cy="114.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="367.9" cy="122.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="366.5" cy="58.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="378.9" cy="43.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="366.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="378.2" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="373.2" cy="61.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="384.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="379.5" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="369.1" cy="42.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="371.5" cy="34.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="371.1" cy="59.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="383.9" cy="32.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="360.4" cy="144.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="369.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="373.1" cy="36.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="370.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="375.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="372.0" cy="95.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="369.2" cy="64.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="378.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="366.5" cy="158.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="375.4" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="379.3" cy="36.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="360.2" cy="87.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="366.4" cy="57.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="386.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="386.9" cy="53.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="387.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="357.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="382.4" cy="54.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="385.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="384.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="378.9" cy="33.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="377.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="379.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="374.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="381.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="372.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="363.2" cy="60.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="359.0" cy="47.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="385.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="380.2" cy="53.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="361.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="382.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="365.6" cy="36.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="376.3" cy="106.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="367.4" cy="116.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="362.9" cy="92.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="361.6" cy="61.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.3" cy="94.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.4" cy="120.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="358.9" cy="147.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="382.7" cy="55.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="372.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="360.1" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="372.8" cy="139.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="373.4" cy="188.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="371.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="362.6" cy="44.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="369.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="383.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="368.3" cy="117.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="372.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="385.8" cy="134.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="363.4" cy="202.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="379.2" cy="47.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="371.5" cy="43.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="381.2" cy="67.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="367.5" cy="41.2" r="2.2" opacity=".7"/>
<circle class="sPg" cx="373.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="367.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="383.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="385.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="376.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="387.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="379.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="382.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="384.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="364.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="387.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="368.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="371.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="361.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="382.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="366.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="378.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="363.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="367.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="368.3" cy="32.0" r="2.2" opacity=".7"/>
<text class="sS" x="428" y="222" text-anchor="middle">6</text>
<circle class="sPv" cx="419.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="413.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="436.6" cy="42.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="442.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="419.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="417.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.1" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="414.6" cy="46.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="432.8" cy="50.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="430.0" cy="37.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="441.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="439.6" cy="88.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="441.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="441.9" cy="37.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="430.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="428.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="413.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="415.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="428.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="439.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="425.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="412.1" cy="45.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="418.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="436.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="417.1" cy="173.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="418.4" cy="98.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="421.1" cy="52.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="431.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="438.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="419.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="431.2" cy="39.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="429.0" cy="51.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="426.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="430.6" cy="88.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="438.1" cy="63.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="419.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="427.9" cy="135.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="415.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="428.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="437.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="444.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="427.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="421.5" cy="81.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="430.5" cy="141.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.9" cy="34.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="415.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="428.8" cy="58.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="437.6" cy="118.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="440.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="443.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="420.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="415.5" cy="85.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="426.0" cy="46.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="437.8" cy="33.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="419.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="439.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="434.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="418.4" cy="85.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="432.2" cy="55.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="438.2" cy="202.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="441.9" cy="84.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="417.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="438.3" cy="114.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="436.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="419.8" cy="72.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="421.4" cy="133.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="442.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.6" cy="33.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="421.2" cy="202.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="435.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="416.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="427.5" cy="102.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="423.5" cy="66.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="429.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="431.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="432.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="425.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="440.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="438.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="441.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="426.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="435.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="425.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="420.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="432.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="442.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="437.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="421.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="419.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="436.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="434.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="439.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="416.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="439.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="425.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="420.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="423.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="443.8" cy="32.0" r="2.2" opacity=".7"/>
<text class="sS" x="484" y="222" text-anchor="middle">7</text>
<circle class="sPv" cx="498.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="470.7" cy="54.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.1" cy="96.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="491.0" cy="123.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="469.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="469.1" cy="77.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="469.4" cy="58.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.8" cy="174.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.7" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.2" cy="60.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="493.4" cy="39.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.2" cy="49.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="491.6" cy="38.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="479.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="477.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="480.4" cy="70.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="473.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="470.4" cy="96.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.9" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.8" cy="39.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="482.7" cy="159.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="490.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.6" cy="67.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="480.5" cy="37.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="490.8" cy="67.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="492.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="470.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="472.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="492.0" cy="120.5" r="2.2" opacity=".7"/>
<circle class="sPv" cx="490.6" cy="85.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="473.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="494.5" cy="121.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="493.6" cy="55.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.6" cy="123.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.9" cy="81.3" r="2.2" opacity=".7"/>
<circle class="sPv" cx="471.5" cy="98.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="482.3" cy="50.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="471.5" cy="65.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="485.4" cy="111.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="488.0" cy="139.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="486.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="470.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="487.9" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="492.1" cy="34.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="472.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="487.0" cy="35.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="494.2" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="474.2" cy="83.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.2" cy="107.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="499.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="490.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.9" cy="123.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="476.7" cy="202.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="489.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="469.4" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="494.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="475.6" cy="50.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="493.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="488.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="493.6" cy="91.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="480.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="482.4" cy="36.7" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="470.3" cy="94.2" r="2.2" opacity=".7"/>
<circle class="sPv" cx="473.0" cy="135.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="499.1" cy="106.1" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.2" cy="138.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="472.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="499.2" cy="38.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="476.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="496.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.0" cy="116.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="468.8" cy="143.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="468.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPv" cx="478.5" cy="154.8" r="2.2" opacity=".7"/>
<circle class="sPv" cx="497.8" cy="34.6" r="2.2" opacity=".7"/>
<circle class="sPv" cx="493.3" cy="38.4" r="2.2" opacity=".7"/>
<circle class="sPv" cx="480.4" cy="53.9" r="2.2" opacity=".7"/>
<circle class="sPv" cx="495.5" cy="124.4" r="2.2" opacity=".7"/>
<circle class="sPg" cx="477.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="479.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="474.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="498.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="493.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="482.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="476.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="498.9" cy="36.5" r="2.2" opacity=".7"/>
<circle class="sPg" cx="480.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="474.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="481.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="491.0" cy="35.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="492.7" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="471.5" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="498.3" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="489.6" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="470.0" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="494.8" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="499.1" cy="32.0" r="2.2" opacity=".7"/>
<circle class="sPg" cx="494.8" cy="34.4" r="2.2" opacity=".7"/>
<polyline class="sLw" points="92.0,183.2 148.0,120.5 204.0,72.8 260.0,61.8 316.0,63.4 372.0,63.2 428.0,50.8 484.0,62.9" style="fill:none;stroke-width:2.4"/>
<line class="sLr" x1="66" y1="191.489" x2="520" y2="191.489" stroke-dasharray="5 4"/>
<text class="sRt" x="516" y="185.489" text-anchor="end">hard-coded baseline: 41.7</text>
<text class="sS" x="293" y="240" text-anchor="middle">generation (100 random linear policies, then: keep best 20, add 80 mutated copies)</text>
<rect class="sN" x="540" y="30" width="166" height="176" rx="8"/>
<text class="sT" x="623" y="52" text-anchor="middle">policy: push right</text><text class="sT" x="623" y="68" text-anchor="middle">if w · obs &gt; 0</text>
<text class="sWt" x="623" y="96" text-anchor="middle">mean, gen 0: 66</text><text class="sWt" x="623" y="114" text-anchor="middle">mean, gen 7: 411</text>
<text class="sS" x="623" y="142" text-anchor="middle">best policy on 100</text><text class="sGt" x="623" y="158" text-anchor="middle">new episodes: 500</text>
<text class="sS" x="623" y="186" text-anchor="middle">4 weights, no gradients</text>
</svg><figcaption>Policy search by genetic algorithm, run in Gymnasium: each dot is one policy's average over 5 episodes; the amber line is the population mean; green dots are the 20 survivors of the previous generation.</figcaption></figure>

---

## 24.3 Neural-network policies 🔴

> [!info] 📖 Géron Ch. 19 · “Neural Network Policies” · pp. 749–752

A small network takes the observation and outputs **one logit = the log-odds of action 1** (right). We then **sample** from the resulting Bernoulli distribution:

```python
import torch, torch.nn as nn

class PolicyNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(4, 5), nn.ReLU(), nn.Linear(5, 1))
    def forward(self, state):
        return self.net(state)

def choose_action(model, obs):
    state = torch.as_tensor(obs)
    logit = model(state)
    dist = torch.distributions.Bernoulli(logits=logit)
    action = dist.sample()
    return int(action.item()), dist.log_prob(action)
```

<figure class="dia steps"><svg viewBox="0 0 720 250" role="img" aria-label="The untrained policy network from the code run on CartPole's first observation: four inputs, five ReLU hidden units, one logit, a sigmoid probability of pushing right, and 1,000 Bernoulli samples that split between left and right roughly in that proportion">
<line class="sLm" x1="166" y1="44" x2="314" y2="30" opacity=".25"/>
<line class="sLm" x1="166" y1="44" x2="314" y2="68" opacity=".25"/>
<line class="sLm" x1="166" y1="44" x2="314" y2="106" opacity=".25"/>
<line class="sLm" x1="166" y1="44" x2="314" y2="144" opacity=".25"/>
<line class="sLm" x1="166" y1="44" x2="314" y2="182" opacity=".25"/>
<line class="sLm" x1="166" y1="88" x2="314" y2="30" opacity=".25"/>
<line class="sLm" x1="166" y1="88" x2="314" y2="68" opacity=".25"/>
<line class="sLm" x1="166" y1="88" x2="314" y2="106" opacity=".25"/>
<line class="sLm" x1="166" y1="88" x2="314" y2="144" opacity=".25"/>
<line class="sLm" x1="166" y1="88" x2="314" y2="182" opacity=".25"/>
<line class="sLm" x1="166" y1="132" x2="314" y2="30" opacity=".25"/>
<line class="sLm" x1="166" y1="132" x2="314" y2="68" opacity=".25"/>
<line class="sLm" x1="166" y1="132" x2="314" y2="106" opacity=".25"/>
<line class="sLm" x1="166" y1="132" x2="314" y2="144" opacity=".25"/>
<line class="sLm" x1="166" y1="132" x2="314" y2="182" opacity=".25"/>
<line class="sLm" x1="166" y1="176" x2="314" y2="30" opacity=".25"/>
<line class="sLm" x1="166" y1="176" x2="314" y2="68" opacity=".25"/>
<line class="sLm" x1="166" y1="176" x2="314" y2="106" opacity=".25"/>
<line class="sLm" x1="166" y1="176" x2="314" y2="144" opacity=".25"/>
<line class="sLm" x1="166" y1="176" x2="314" y2="182" opacity=".25"/>
<line class="sLm" x1="346" y1="30" x2="452" y2="110" opacity=".25"/>
<line class="sLm" x1="346" y1="68" x2="452" y2="110" opacity=".25"/>
<line class="sLm" x1="346" y1="106" x2="452" y2="110" opacity=".25"/>
<line class="sLm" x1="346" y1="144" x2="452" y2="110" opacity=".25"/>
<line class="sLm" x1="346" y1="182" x2="452" y2="110" opacity=".25"/>
<circle class="sB" cx="150" cy="44" r="15"/><text class="sS" x="128" y="42" text-anchor="end">cart position</text><text class="sT" x="128" y="57" text-anchor="end">+0.027</text>
<circle class="sB" cx="150" cy="88" r="15"/><text class="sS" x="128" y="86" text-anchor="end">cart velocity</text><text class="sT" x="128" y="101" text-anchor="end">-0.006</text>
<circle class="sB" cx="150" cy="132" r="15"/><text class="sS" x="128" y="130" text-anchor="end">pole angle</text><text class="sT" x="128" y="145" text-anchor="end">+0.036</text>
<circle class="sB" cx="150" cy="176" r="15"/><text class="sS" x="128" y="174" text-anchor="end">angular velocity</text><text class="sT" x="128" y="189" text-anchor="end">+0.020</text>
<text class="sS" x="150" y="16" text-anchor="middle">obs (4)</text>
<g data-s="2"><circle class="sN" cx="330" cy="30" r="15"/><text class="sS" x="330" y="34" text-anchor="middle">0.00</text><circle class="sN" cx="330" cy="68" r="15"/><text class="sS" x="330" y="72" text-anchor="middle">0.00</text><circle class="sN" cx="330" cy="106" r="15"/><text class="sS" x="330" y="110" text-anchor="middle">0.00</text><circle class="sG" cx="330" cy="144" r="15"/><text class="sS" x="330" y="148" text-anchor="middle">0.35</text><circle class="sN" cx="330" cy="182" r="15"/><text class="sS" x="330" y="186" text-anchor="middle">0.00</text><text class="sS" x="330" y="16" text-anchor="middle">ReLU (5)</text><text class="sS" x="330" y="218" text-anchor="middle">zeros: ReLU switched off</text></g>
<g data-s="3"><circle class="sA" cx="470" cy="110" r="17"/><text class="sS" x="470" y="114" text-anchor="middle">0.42</text><text class="sS" x="470" y="84" text-anchor="middle">logit</text><line class="sLm" x1="490" y1="110" x2="534" y2="110" marker-end="url(#ahm)"/><text class="sS" x="560" y="104" text-anchor="middle">sigmoid</text><text class="sGt" x="560" y="132" text-anchor="middle">P(right) = 0.603</text></g>
<g data-s="4"><rect class="sN" x="600" y="40" width="106" height="140" rx="8"/><text class="sT" x="653" y="60" text-anchor="middle">1,000 samples</text><rect class="sB" x="612" y="130.2" width="36" height="39.8" rx="3"/><rect class="sG" x="658" y="109.8" width="36" height="60.2" rx="3"/><text class="sS" x="630" y="126.2" text-anchor="middle">40%</text><text class="sS" x="676" y="105.8" text-anchor="middle">60%</text><text class="sS" x="630" y="196" text-anchor="middle">left</text><text class="sS" x="676" y="196" text-anchor="middle">right</text></g>
<text class="sS" x="360" y="238" text-anchor="middle">PolicyNetwork: Linear(4, 5) → ReLU → Linear(5, 1), 31 parameters, untrained (seed 42)</text>
</svg><ol class="dia-steps">
<li>The observation from CartPole's first reset: four numbers describe the whole state, so one frame is enough.</li>
<li>The hidden layer applies weights and ReLU. With random weights some units are simply off.</li>
<li>One output logit, the log-odds of pushing right; the sigmoid turns it into P(right) = 0.603.</li>
<li>The action is sampled, not chosen: over 1,000 draws it went right 60% of the time. That randomness is the exploration.</li>
</ol><figcaption>One forward pass of the policy network above, computed with PyTorch, and why sampling the action gives exploration for free.</figcaption></figure>

**Why sample instead of taking the most likely action?** To balance **exploring** new actions against **exploiting** what already works. Géron's analogy: going to a restaurant, you mostly order what you like but sometimes try something new.

CartPole's state is fully observable in one frame, so past observations aren't needed. If an environment hides information (e.g., only positions, not velocities), feed the network the last few observations — exactly what Atari agents do by **stacking 4 frames**.

---

## 24.4 The credit-assignment problem, returns and discounting 🟡

> [!info] 📖 Géron Ch. 19 · “Evaluating Actions: The Credit Assignment Problem” · pp. 752–753

![The discount factor γ sets how far ahead the agent looks.](figures/fig24_discount.png)
*The discount factor γ sets how far ahead the agent looks.*

If we knew the best action at each step, we'd just do supervised learning. We don't: the reward for a good action may come **many steps later**, mixed with the effects of other actions. When the agent balances the pole for 100 steps and then fails, which actions were to blame? This is the **credit-assignment problem**.

**Solution:** judge each action by the **sum of all rewards that follow it**, with future rewards shrunk by a **discount factor γ** (gamma) per step. This sum is the action's **return**:

$$G_t = r_{t+1} + \gamma\, r_{t+2} + \gamma^2 r_{t+3} + \dots = r_{t+1} + \gamma G_{t+1}$$

**Worked example (Géron):** rewards **+10, 0, −50**, γ = 0.8.

| Step | Computation (backwards) | Return |
|---|---|---|
| 3 | −50 | **−50** |
| 2 | 0 + 0.8 × (−50) | **−40** |
| 1 | 10 + 0.8 × (−40) | **−22** |

```python
def compute_returns(rewards, discount_factor):
    returns = rewards[:]                              # copy
    for step in range(len(returns) - 2, -1, -1):
        returns[step] += discount_factor * returns[step + 1]
    return torch.tensor(returns)
```

**Choosing γ:**
- γ close to 0 → only immediate rewards matter (myopic).
- γ close to 1 → the far future matters as much as now.
- Rule of thumb: rewards ~n steps ahead matter where γⁿ ≈ 0.5. γ = 0.95 → ~13 steps; γ = 0.99 → ~69 steps. CartPole: 0.95 works (effects of an action show within a few steps). SB3's Breakout PPO uses 0.99.
- **The optimal policy can change with γ** (see the MDP example in §24.6).

**Action advantage:** a good action followed by bad ones gets a low return — unfair. With enough episodes, good actions still average higher returns than bad ones. So we **normalise** the returns across many episodes (subtract the mean, divide by the std): positive = better than average (an estimate of the **advantage**).

---

## 24.5 Policy gradients: the REINFORCE algorithm (Williams, 1992) 🔴

> [!info] 📖 Géron Ch. 19 · “Solving the CartPole Using Policy Gradients” · pp. 753–756

**Idea:** play several episodes with the current policy, compute each action's (normalised) return, then make **good actions more likely and bad actions less likely**.

The loss for one action is **−log π(a|s) × advantage**. Minimising it raises the log-probability of actions with a positive advantage and lowers it for negative ones.

```python
def run_episode(model, env, seed=None):
    log_probs, rewards = [], []
    obs, info = env.reset(seed=seed)
    while True:
        action, log_prob = choose_action(model, obs)
        obs, reward, done, truncated, _info = env.step(action)
        log_probs.append(log_prob); rewards.append(reward)
        if done or truncated:
            return log_probs, rewards

def train_reinforce(model, optimizer, env, n_iterations, n_episodes_per_update,
                    discount_factor):
    for iteration in range(n_iterations):
        all_log_probs, all_returns = [], []
        for episode in range(n_episodes_per_update):
            log_probs, rewards = run_episode(model, env)
            all_log_probs.extend(log_probs)
            all_returns.append(compute_returns(rewards, discount_factor))
        returns = torch.cat(all_returns)
        returns = (returns - returns.mean()) / (returns.std() + 1e-7)  # standardise
        loss = -(torch.cat(all_log_probs).squeeze() * returns).sum()
        optimizer.zero_grad(); loss.backward(); optimizer.step()

model = PolicyNetwork()
optimizer = torch.optim.NAdam(model.parameters(), lr=0.06)
train_reinforce(model, optimizer, env, n_iterations=200, n_episodes_per_update=10,
                discount_factor=0.95)
```

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="REINFORCE on a two-action problem with rewards around 5, over 200 runs: with the raw reward the probability of the better action spreads widely and some runs settle on the worse action; subtracting a running-average baseline gives a much narrower band and no run ends on the worse action">
<line class="sLm" x1="60" y1="200" x2="620" y2="200"/><line class="sLm" x1="60" y1="200" x2="60" y2="26"/>
<text class="sS" x="54" y="204" text-anchor="end">0</text><line class="sLm" x1="60" y1="200" x2="620" y2="200" opacity=".2"/>
<text class="sS" x="54" y="119" text-anchor="end">0.5</text><line class="sLm" x1="60" y1="115" x2="620" y2="115" opacity=".2"/>
<text class="sS" x="54" y="34" text-anchor="end">1</text><line class="sLm" x1="60" y1="30" x2="620" y2="30" opacity=".2"/>
<text class="sS" x="60" y="216" text-anchor="middle">0</text>
<text class="sS" x="200" y="216" text-anchor="middle">100</text>
<text class="sS" x="340" y="216" text-anchor="middle">200</text>
<text class="sS" x="480" y="216" text-anchor="middle">300</text>
<text class="sS" x="620" y="216" text-anchor="middle">400</text>
<polygon class="sW" opacity=".3" points="60.0,115.0 65.6,102.0 71.2,95.4 76.8,91.8 82.4,83.3 88.0,80.7 93.6,80.2 99.2,77.9 104.8,77.1 110.4,75.0 116.0,74.2 121.6,70.9 127.2,69.7 132.8,67.0 138.4,65.8 144.0,65.9 149.6,63.3 155.2,64.1 160.8,62.4 166.4,62.4 172.0,61.5 177.6,59.2 183.2,59.6 188.8,58.0 194.4,57.2 200.0,56.2 205.6,55.2 211.2,53.8 216.8,52.7 222.4,53.0 228.0,51.3 233.6,50.7 239.2,51.4 244.8,50.7 250.4,49.0 256.0,49.2 261.6,48.2 267.2,48.0 272.8,47.7 278.4,46.5 284.0,48.0 289.6,48.2 295.2,47.4 300.8,46.2 306.4,46.5 312.0,45.3 317.6,45.4 323.2,44.9 328.8,44.9 334.4,44.6 340.0,44.3 345.6,44.3 351.2,44.4 356.8,44.2 362.4,44.1 368.0,43.5 373.6,42.9 379.2,43.3 384.8,43.2 390.4,42.5 396.0,42.9 401.6,42.5 407.2,42.3 412.8,41.9 418.4,42.1 424.0,41.8 429.6,41.6 435.2,41.5 440.8,41.6 446.4,41.5 452.0,41.2 457.6,40.6 463.2,40.1 468.8,39.9 474.4,40.0 480.0,39.6 485.6,39.3 491.2,39.0 496.8,38.7 502.4,38.9 508.0,39.2 513.6,38.9 519.2,38.7 524.8,38.6 530.4,38.3 536.0,38.2 541.6,38.3 547.2,38.8 552.8,38.6 558.4,38.5 564.0,38.2 569.6,38.2 575.2,37.9 580.8,38.2 586.4,38.5 592.0,38.6 597.6,38.4 603.2,38.4 608.8,38.1 614.4,37.8 614.4,131.8 608.8,139.4 603.2,146.3 597.6,144.7 592.0,141.8 586.4,140.4 580.8,141.6 575.2,139.6 569.6,146.0 564.0,139.8 558.4,148.4 552.8,145.7 547.2,145.9 541.6,141.0 536.0,148.9 530.4,147.6 524.8,145.5 519.2,144.9 513.6,152.0 508.0,145.8 502.4,144.6 496.8,142.4 491.2,145.5 485.6,146.2 480.0,148.7 474.4,147.4 468.8,146.1 463.2,147.9 457.6,152.1 452.0,154.8 446.4,150.5 440.8,155.4 435.2,152.4 429.6,156.3 424.0,154.1 418.4,154.8 412.8,154.1 407.2,159.6 401.6,157.8 396.0,153.9 390.4,151.6 384.8,153.9 379.2,156.9 373.6,154.2 368.0,149.2 362.4,156.3 356.8,154.4 351.2,155.5 345.6,157.9 340.0,154.0 334.4,155.7 328.8,154.6 323.2,154.8 317.6,156.1 312.0,154.9 306.4,156.5 300.8,154.3 295.2,155.5 289.6,154.4 284.0,158.2 278.4,153.9 272.8,156.1 267.2,152.5 261.6,160.2 256.0,159.9 250.4,160.2 244.8,160.0 239.2,159.3 233.6,161.4 228.0,159.8 222.4,155.8 216.8,156.6 211.2,156.2 205.6,154.8 200.0,155.8 194.4,150.7 188.8,146.7 183.2,147.3 177.6,147.2 172.0,149.1 166.4,145.3 160.8,144.5 155.2,144.8 149.6,142.5 144.0,141.1 138.4,142.0 132.8,138.9 127.2,139.1 121.6,140.3 116.0,136.7 110.4,140.7 104.8,139.7 99.2,137.1 93.6,134.7 88.0,133.5 82.4,132.4 76.8,131.1 71.2,128.1 65.6,123.8 60.0,115.0"/>
<polyline class="sLw" points="60.0,115.0 65.6,112.6 71.2,112.0 76.8,110.4 82.4,108.8 88.0,107.8 93.6,107.7 99.2,107.2 104.8,104.9 110.4,104.5 116.0,103.8 121.6,102.8 127.2,102.7 132.8,101.9 138.4,101.8 144.0,101.9 149.6,101.2 155.2,100.6 160.8,99.8 166.4,99.3 172.0,98.8 177.6,98.5 183.2,99.1 188.8,98.4 194.4,97.5 200.0,98.0 205.6,97.5 211.2,97.1 216.8,97.3 222.4,97.1 228.0,96.8 233.6,96.3 239.2,96.3 244.8,95.9 250.4,94.6 256.0,94.6 261.6,94.1 267.2,92.0 272.8,91.2 278.4,91.4 284.0,90.8 289.6,89.9 295.2,90.1 300.8,89.5 306.4,89.6 312.0,89.2 317.6,88.1 323.2,87.4 328.8,86.9 334.4,86.9 340.0,86.4 345.6,86.5 351.2,85.5 356.8,85.0 362.4,85.4 368.0,85.3 373.6,85.2 379.2,85.2 384.8,84.8 390.4,84.4 396.0,84.0 401.6,83.8 407.2,83.8 412.8,83.0 418.4,82.9 424.0,82.2 429.6,81.5 435.2,81.0 440.8,80.5 446.4,80.3 452.0,79.7 457.6,79.4 463.2,78.5 468.8,78.3 474.4,78.6 480.0,78.8 485.6,77.9 491.2,77.2 496.8,76.2 502.4,76.0 508.0,76.0 513.6,75.7 519.2,75.1 524.8,74.6 530.4,74.1 536.0,73.7 541.6,73.4 547.2,73.9 552.8,73.9 558.4,73.7 564.0,72.8 569.6,72.7 575.2,71.8 580.8,71.6 586.4,71.1 592.0,70.9 597.6,70.5 603.2,70.3 608.8,70.2 614.4,69.8" style="stroke-width:2.4"/>
<polygon class="sG" opacity=".3" points="60.0,115.0 65.6,102.4 71.2,98.4 76.8,95.6 82.4,90.8 88.0,90.5 93.6,89.5 99.2,88.1 104.8,86.4 110.4,85.7 116.0,84.9 121.6,84.4 127.2,84.1 132.8,83.3 138.4,82.1 144.0,80.5 149.6,79.9 155.2,79.8 160.8,79.6 166.4,78.9 172.0,78.2 177.6,78.0 183.2,77.7 188.8,77.3 194.4,77.1 200.0,76.5 205.6,75.3 211.2,75.2 216.8,74.1 222.4,73.6 228.0,73.6 233.6,73.2 239.2,72.8 244.8,71.5 250.4,71.8 256.0,71.1 261.6,70.8 267.2,70.4 272.8,70.1 278.4,69.0 284.0,68.7 289.6,68.2 295.2,67.5 300.8,67.5 306.4,66.6 312.0,66.2 317.6,65.3 323.2,65.2 328.8,65.1 334.4,64.5 340.0,64.3 345.6,63.7 351.2,62.4 356.8,62.3 362.4,61.8 368.0,61.4 373.6,61.4 379.2,61.2 384.8,60.8 390.4,60.8 396.0,60.3 401.6,59.7 407.2,59.6 412.8,58.7 418.4,58.3 424.0,58.1 429.6,57.9 435.2,57.7 440.8,56.9 446.4,56.5 452.0,56.0 457.6,56.2 463.2,55.6 468.8,55.5 474.4,55.2 480.0,55.1 485.6,54.8 491.2,54.4 496.8,53.9 502.4,53.4 508.0,53.0 513.6,52.7 519.2,52.7 524.8,52.6 530.4,52.2 536.0,52.2 541.6,51.7 547.2,51.6 552.8,51.5 558.4,51.3 564.0,51.2 569.6,51.1 575.2,51.0 580.8,50.5 586.4,50.4 592.0,50.2 597.6,50.0 603.2,49.9 608.8,49.3 614.4,49.8 614.4,72.0 608.8,71.6 603.2,72.8 597.6,74.0 592.0,73.7 586.4,74.6 580.8,75.2 575.2,75.2 569.6,75.8 564.0,75.0 558.4,75.8 552.8,77.1 547.2,77.8 541.6,78.6 536.0,78.3 530.4,78.5 524.8,80.3 519.2,79.1 513.6,80.0 508.0,80.6 502.4,81.0 496.8,82.3 491.2,82.6 485.6,83.0 480.0,82.6 474.4,83.7 468.8,84.3 463.2,85.1 457.6,85.7 452.0,85.4 446.4,85.4 440.8,85.1 435.2,85.7 429.6,86.7 424.0,86.6 418.4,87.1 412.8,87.9 407.2,87.8 401.6,87.4 396.0,88.6 390.4,89.4 384.8,90.9 379.2,92.8 373.6,91.7 368.0,92.1 362.4,93.2 356.8,93.1 351.2,94.6 345.6,95.9 340.0,95.9 334.4,96.6 328.8,97.5 323.2,98.0 317.6,98.7 312.0,100.3 306.4,100.4 300.8,101.6 295.2,100.8 289.6,102.8 284.0,103.6 278.4,104.6 272.8,104.9 267.2,105.1 261.6,106.2 256.0,107.3 250.4,107.8 244.8,110.5 239.2,110.5 233.6,111.6 228.0,112.8 222.4,113.6 216.8,114.5 211.2,114.5 205.6,115.5 200.0,115.5 194.4,117.5 188.8,115.9 183.2,116.7 177.6,117.4 172.0,118.6 166.4,117.6 160.8,118.5 155.2,120.6 149.6,121.1 144.0,121.9 138.4,122.4 132.8,123.4 127.2,122.6 121.6,124.6 116.0,123.9 110.4,126.2 104.8,126.3 99.2,127.2 93.6,126.3 88.0,126.5 82.4,125.6 76.8,127.3 71.2,126.7 65.6,123.5 60.0,115.0"/>
<polyline class="sLg" points="60.0,115.0 65.6,112.7 71.2,112.1 76.8,110.7 82.4,109.4 88.0,108.5 93.6,107.8 99.2,107.2 104.8,106.2 110.4,105.3 116.0,104.5 121.6,103.8 127.2,103.0 132.8,102.4 138.4,101.7 144.0,100.9 149.6,100.1 155.2,99.5 160.8,98.8 166.4,98.1 172.0,97.5 177.6,96.7 183.2,96.2 188.8,95.5 194.4,94.8 200.0,94.2 205.6,93.7 211.2,92.9 216.8,92.3 222.4,91.6 228.0,91.0 233.6,90.4 239.2,89.7 244.8,88.9 250.4,88.2 256.0,87.6 261.6,86.9 267.2,86.3 272.8,85.6 278.4,85.1 284.0,84.4 289.6,83.9 295.2,83.4 300.8,82.8 306.4,82.2 312.0,81.6 317.6,81.0 323.2,80.3 328.8,79.7 334.4,79.3 340.0,78.7 345.6,78.2 351.2,77.5 356.8,77.1 362.4,76.5 368.0,76.0 373.6,75.5 379.2,75.1 384.8,74.6 390.4,74.1 396.0,73.6 401.6,73.1 407.2,72.8 412.8,72.3 418.4,71.7 424.0,71.3 429.6,70.9 435.2,70.4 440.8,70.1 446.4,69.6 452.0,69.4 457.6,69.0 463.2,68.5 468.8,68.1 474.4,67.7 480.0,67.3 485.6,67.0 491.2,66.6 496.8,66.2 502.4,65.8 508.0,65.5 513.6,65.0 519.2,64.6 524.8,64.4 530.4,64.1 536.0,63.8 541.6,63.4 547.2,63.1 552.8,63.0 558.4,62.7 564.0,62.4 569.6,62.0 575.2,61.6 580.8,61.4 586.4,61.0 592.0,60.8 597.6,60.5 603.2,60.1 608.8,59.8 614.4,59.5" style="stroke-width:2.4"/>
<text class="sGt" x="626" y="41.3155">baseline</text><text class="sGt" x="626" y="55.3155">0% stuck</text><text class="sWt" x="626" y="83.7535">raw reward</text><text class="sWt" x="626" y="97.7535">15% stuck</text>
<text class="sC" x="340" y="234" text-anchor="middle">updates →   P(better action), mean of 200 runs with a 10–90% band</text>
<text class="sS" x="70" y="22">rewards are always positive, so without a baseline every sampled action gets pushed up</text>
</svg><figcaption>Why REINFORCE standardises returns: a baseline keeps the gradient unbiased but cuts its variance, so fewer runs lock onto the wrong action. Simulated; "stuck" = runs ending with P(better) below 0.5.</figcaption></figure>

Result: the agent balances the pole far longer than the hard-coded policy.

**Weaknesses of REINFORCE** (know these):
- **High variance** — the return is a noisy signal; training is unstable.
- **Sample-inefficient** — it's **on-policy**: data from the old policy is thrown away after each update.
- Very sensitive to hyperparameters and random seeds.

> Andrej Karpathy's famous observation (from his *"Deep RL doesn't work yet"*-era posts): RL has to be *forced* to work. Expect to tune a lot; always compare against a baseline.

---

## 24.6 Markov Decision Processes (MDPs) and value-based methods 🔴

> [!info] 📖 Géron Ch. 19 · “Value-Based Methods”, “Markov Decision Processes” · pp. 756–761

**Markov chain:** a fixed number of states, with a transition probability from each state to each other state that depends **only on the current state** (the **Markov property**, memoryless). States with no exit are **terminal**.

**MDP (Bellman, 1950s)** = a Markov chain where the agent picks an **action** at each step, and transitions + rewards depend on (state, action). Notation:
- **T(s, a, s′)** — probability of reaching s′ after action a in state s.
- **R(s, a, s′)** — reward for that transition.

### Bellman optimality equation

The **optimal state value V\*(s)** = the expected discounted return starting from s if the agent acts optimally:

$$V^*(s) = \max_a \sum_{s'} T(s,a,s')\,\big[R(s,a,s') + \gamma\, V^*(s')\big]$$

In words: "the value of a state = the best action's expected immediate reward plus the discounted value of wherever you land". This recursive definition leads to **value iteration** — start with V = 0 everywhere and apply the equation repeatedly; it converges to V\*. It is an example of **dynamic programming**.

### Q-values and Q-value iteration

V\* tells you how good a state is, but not **what to do**. **Q\*(s, a)** is the expected discounted return of taking action a in s, then acting optimally:

$$Q_{k+1}(s,a) \leftarrow \sum_{s'} T(s,a,s')\,\big[R(s,a,s') + \gamma \max_{a'} Q_k(s',a')\big]$$

**The optimal policy:** π\*(s) = argmax_a Q\*(s, a).

Géron's 3-state MDP (s0, s1, s2; s1 has a "fire" action costing −50; s2 → s0 gives +40):

```python
import numpy as np
transition_probabilities = [  # shape [s, a, s']
    [[0.7, 0.3, 0.0], [1.0, 0.0, 0.0], [0.8, 0.2, 0.0]],
    [[0.0, 1.0, 0.0], None, [0.0, 0.0, 1.0]],
    [None, [0.8, 0.1, 0.1], None]]
rewards = [  # shape [s, a, s']
    [[+10, 0, 0], [0, 0, 0], [0, 0, 0]],
    [[0, 0, 0], [0, 0, 0], [0, 0, -50]],
    [[0, 0, 0], [+40, 0, 0], [0, 0, 0]]]
possible_actions = [[0, 1, 2], [0, 2], [1]]

Q_values = np.full((3, 3), -np.inf)           # -inf for impossible actions
for state, actions in enumerate(possible_actions):
    Q_values[state, actions] = 0.0

gamma = 0.90
for iteration in range(50):
    Q_prev = Q_values.copy()
    for s in range(3):
        for a in possible_actions[s]:
            Q_values[s, a] = np.sum([
                transition_probabilities[s][a][sp]
                * (rewards[s][a][sp] + gamma * Q_prev[sp].max())
                for sp in range(3)])
```

Result:
```
[[18.92, 17.03, 13.62],
 [ 0.  ,  -inf, -4.88],
 [ -inf, 50.13,  -inf]]      argmax → [0, 0, 1]
```

With γ = 0.90, in s1 the best action is a0 ("stay put"). **With γ = 0.95 the best action in s1 becomes a2 — go through the fire**: the more you value the future, the more short- term pain you accept for later reward. (This is the answer to "can γ change the optimal policy?" — yes.)

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Géron's three-state MDP: s0 can loop for a reward of 10 or drift to s1; s1 can stay or go through fire for minus 50 into s2; s2 returns to s0 for plus 40. Q-value iteration shows the best action in s1 is to stay at gamma 0.90 but to go through the fire at gamma 0.95">
<circle class="sB" cx="90" cy="120" r="26"/><text class="sT" x="90" y="125" text-anchor="middle">s0</text>
<circle class="sB" cx="330" cy="64" r="26"/><text class="sT" x="330" y="69" text-anchor="middle">s1</text>
<circle class="sB" cx="330" cy="196" r="26"/><text class="sT" x="330" y="201" text-anchor="middle">s2</text>
<path class="sLg" d="M 68 104 C 20 70, 20 170, 68 136" marker-end="url(#ahg)"/><text class="sGt" x="22" y="98">a0: +10</text><text class="sS" x="22" y="152">p 0.7</text>
<line class="sL" x1="114" y1="108" x2="302" y2="70" marker-end="url(#ah)"/><text class="sC" x="196" y="74" text-anchor="middle">a0 (0.3), a2 (0.2)</text>
<path class="sL" d="M 350 46 C 380 10, 420 50, 356 68" marker-end="url(#ah)"/><text class="sC" x="344" y="24" text-anchor="end">a0: stay, 0</text>
<line class="sLr" x1="330" y1="90" x2="330" y2="168" marker-end="url(#ahr)"/><text class="sRt" x="338" y="134">a2: fire −50</text>
<line class="sLg" x1="304" y1="190" x2="116" y2="132" marker-end="url(#ahg)"/><text class="sGt" x="190" y="184" text-anchor="middle">a1: +40 (0.8)</text>
<text class="sS" x="330" y="238" text-anchor="middle">a1 from s2 also lands on s1 or s2 with 0.1 each; s0's other actions mostly stay</text>
<rect class="sN" x="458" y="20" width="248" height="194" rx="8"/><text class="sT" x="582" y="40" text-anchor="middle">Q*(s, a) by Q-value iteration</text>
<text class="sM" x="500" y="64" text-anchor="middle"></text>
<text class="sM" x="580" y="64" text-anchor="middle">γ = 0.90</text>
<text class="sM" x="660" y="64" text-anchor="middle">γ = 0.95</text>
<text class="sC" x="500" y="86" text-anchor="middle">s0, a0</text><text class="sGt" x="580" y="86" text-anchor="middle">18.9</text><text class="sGt" x="660" y="86" text-anchor="middle">21.9</text>
<text class="sC" x="500" y="106" text-anchor="middle">s0, a1</text><text class="sC" x="580" y="106" text-anchor="middle">17.0</text><text class="sC" x="660" y="106" text-anchor="middle">20.8</text>
<text class="sC" x="500" y="126" text-anchor="middle">s0, a2</text><text class="sC" x="580" y="126" text-anchor="middle">13.6</text><text class="sC" x="660" y="126" text-anchor="middle">16.9</text>
<text class="sRt" x="500" y="146" text-anchor="middle">s1, a0</text><text class="sGt" x="580" y="146" text-anchor="middle">0.0</text><text class="sC" x="660" y="146" text-anchor="middle">1.1</text>
<text class="sRt" x="500" y="166" text-anchor="middle">s1, a2</text><text class="sC" x="580" y="166" text-anchor="middle">−4.9</text><text class="sGt" x="660" y="166" text-anchor="middle">1.2</text>
<text class="sC" x="500" y="186" text-anchor="middle">s2, a1</text><text class="sGt" x="580" y="186" text-anchor="middle">50.1</text><text class="sGt" x="660" y="186" text-anchor="middle">53.9</text>
<text class="sRt" x="582" y="210" text-anchor="middle">in s1: γ 0.90 picks a0, γ 0.95 picks a2</text>
</svg><figcaption>The MDP behind the code, and the computed Q-values: valuing the future more (higher γ) makes the −50 worth paying. Green marks the best action per state.</figcaption></figure>

---

## 24.7 Temporal Difference learning and Q-learning (model-free) 🟡

> [!info] 📖 Géron Ch. 19 · “Temporal Difference Learning”, “Q-Learning”, “Exploration Policies” · pp. 761–765

In real problems the agent **doesn't know T or R**. It must learn from experience.

**TD learning** updates a running estimate after each observed transition (s, r, s′):

$$V(s) \leftarrow V(s) + \alpha\,\underbrace{\big(\overbrace{r + \gamma V(s')}^{\text{TD target}} - V(s)\big)}_{\text{TD error } \delta}$$

- α = learning rate (e.g., 0.01). Like SGD, one sample at a time; it only truly converges if α **decays**.

**Q-learning** (Watkins, 1989) = Q-value iteration without knowing T and R:

$$Q(s,a) \leftarrow (1-\alpha)\,Q(s,a) + \alpha\big(r + \gamma \max_{a'} Q(s',a')\big)$$

```python
def step(state, action):                   # the environment (hidden from the agent)
    probas = transition_probabilities[state][action]
    next_state = np.random.choice([0, 1, 2], p=probas)
    return next_state, rewards[state][action][next_state]

def exploration_policy(state):             # purely random exploration
    return np.random.choice(possible_actions[state])

alpha0, decay, gamma, state = 0.05, 0.005, 0.90, 0
for iteration in range(10_000):
    action = exploration_policy(state)
    next_state, reward = step(state, action)
    next_value = Q_values[next_state].max()            # greedy at the next step
    alpha = alpha0 / (1 + iteration * decay)            # power scheduling
    Q_values[state, action] *= 1 - alpha
    Q_values[state, action] += alpha * (reward + gamma * next_value)
    state = next_state
```

Q-value iteration converges in **< 20 iterations**; Q-learning needs **~8,000**. Not knowing the model is expensive.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 238" role="img" aria-label="Q-learning on a four-state corridor: the reward at the goal propagates backwards episode by episode until Q-values approach 10, 9 and 8.1">
<rect class="sB" x="20" y="40" width="100" height="56" rx="10"/><text class="sT" x="70" y="64" text-anchor="middle">S0</text><text class="sC" x="70" y="84" text-anchor="middle">reward 0</text>
<line class="sLm" x1="120" y1="68" x2="178" y2="68" marker-end="url(#ahm)"/><text class="sC" x="150" y="60" text-anchor="middle">right</text>
<rect class="sB" x="180" y="40" width="100" height="56" rx="10"/><text class="sT" x="230" y="64" text-anchor="middle">S1</text><text class="sC" x="230" y="84" text-anchor="middle">reward 0</text>
<line class="sLm" x1="280" y1="68" x2="338" y2="68" marker-end="url(#ahm)"/><text class="sC" x="310" y="60" text-anchor="middle">right</text>
<rect class="sB" x="340" y="40" width="100" height="56" rx="10"/><text class="sT" x="390" y="64" text-anchor="middle">S2</text><text class="sC" x="390" y="84" text-anchor="middle">reward 0</text>
<line class="sLm" x1="440" y1="68" x2="498" y2="68" marker-end="url(#ahm)"/><text class="sC" x="470" y="60" text-anchor="middle">right</text>
<rect class="sG" x="500" y="40" width="100" height="56" rx="10"/><text class="sT" x="550" y="64" text-anchor="middle">S3</text><text class="sC" x="550" y="84" text-anchor="middle">goal: +10</text>
<text class="sM" x="40" y="136">Q(s, right)</text>
<g data-s="1-1"><rect class="sN" x="30" y="146" width="80" height="32" rx="6"/><text class="sT" x="70" y="167" text-anchor="middle">0.00</text><rect class="sN" x="190" y="146" width="80" height="32" rx="6"/><text class="sT" x="230" y="167" text-anchor="middle">0.00</text><rect class="sA" x="350" y="146" width="80" height="32" rx="6" opacity="0.65"/><text class="sT" x="390" y="167" text-anchor="middle">5.00</text><text class="sC" x="550" y="167" text-anchor="middle">—</text><text class="sWt" x="550" y="196" text-anchor="middle">after episode 1</text></g>
<g data-s="2-2"><rect class="sN" x="30" y="146" width="80" height="32" rx="6"/><text class="sT" x="70" y="167" text-anchor="middle">0.00</text><rect class="sA" x="190" y="146" width="80" height="32" rx="6" opacity="0.46"/><text class="sT" x="230" y="167" text-anchor="middle">2.25</text><rect class="sA" x="350" y="146" width="80" height="32" rx="6" opacity="0.82"/><text class="sT" x="390" y="167" text-anchor="middle">7.50</text><text class="sC" x="550" y="167" text-anchor="middle">—</text><text class="sWt" x="550" y="196" text-anchor="middle">after episode 2</text></g>
<g data-s="3-3"><rect class="sA" x="30" y="146" width="80" height="32" rx="6" opacity="0.37"/><text class="sT" x="70" y="167" text-anchor="middle">1.01</text><rect class="sA" x="190" y="146" width="80" height="32" rx="6" opacity="0.61"/><text class="sT" x="230" y="167" text-anchor="middle">4.50</text><rect class="sA" x="350" y="146" width="80" height="32" rx="6" opacity="0.91"/><text class="sT" x="390" y="167" text-anchor="middle">8.75</text><text class="sC" x="550" y="167" text-anchor="middle">—</text><text class="sWt" x="550" y="196" text-anchor="middle">after episode 3</text></g>
<g data-s="4-4"><rect class="sA" x="30" y="146" width="80" height="32" rx="6" opacity="0.87"/><text class="sT" x="70" y="167" text-anchor="middle">8.10</text><rect class="sA" x="190" y="146" width="80" height="32" rx="6" opacity="0.93"/><text class="sT" x="230" y="167" text-anchor="middle">9.00</text><rect class="sA" x="350" y="146" width="80" height="32" rx="6" opacity="1.00"/><text class="sT" x="390" y="167" text-anchor="middle">10.00</text><text class="sC" x="550" y="167" text-anchor="middle">—</text><text class="sWt" x="550" y="196" text-anchor="middle">after 60 episodes</text></g>
<text class="sS" x="360" y="226" text-anchor="middle">Q(s,a) ← Q(s,a) + α (r + γ · max Q(s′) − Q(s,a)),  α = 0.5, γ = 0.9</text>
</svg><ol class="dia-steps">
<li>Episode 1: moving right from S0 and S1 earns nothing yet. Only the last move pays: Q(S2, right) becomes 0.5 × 10 = 5.00.</li>
<li>Episode 2: S1 now sees a valuable next state, so its Q-value rises to 0.5 × 0.9 × 5 = 2.25; S2 moves closer to 10.</li>
<li>Episode 3: the value reaches S0 (1.01). Each episode pushes knowledge of the reward one step further back: <b>temporal-difference learning</b>.</li>
<li>After many episodes the values settle near 10, 9 and 8.1: the reward discounted by γ = 0.9 per step. The greedy policy, "always go right", falls out of the table.</li>
</ol><figcaption>Q-learning with real numbers. No model of the world was needed, only experienced transitions and the update rule.</figcaption></figure>

### On-policy vs off-policy (frequent interview question)

- **Off-policy:** the policy being learned is different from the one generating the data. Q-learning learns the *greedy* policy while watching a *random* one act ("learning golf from a blindfolded monkey"). **Benefit:** can reuse old data, logs, other agents' experience, or human demonstrations → far more **sample-efficient**; enables **replay buffers** and **offline RL** from historical logs.
- **On-policy:** explores with the policy being trained (REINFORCE, A2C, PPO, SARSA). More stable in some settings, but must collect fresh data after each update.

### Exploration policies

- **ε-greedy:** act randomly with probability ε, greedily otherwise. Start at ε = 1.0 and decay to ~0.05 (or 0.01).
- **Exploration bonus:** add curiosity for rarely tried actions: Q(s,a) ← r + γ · max f(Q(s′,a′), N(s′,a′)) with f(Q, N) = Q + κ/(1 + N). This is the same idea as **UCB** in bandits (§24.12).

---

## 24.8 Deep Q-Learning (DQN) 🔴

> [!info] 📖 Géron Ch. 19 · “Approximate Q-Learning and Deep Q-Learning” → “DQN Improvements” · pp. 765–773

Tabular Q-learning doesn't scale: Ms. Pac-Man has ~2²⁴⁰ ≈ 10⁷³ pellet configurations alone. **Approximate Q-learning** uses a function Q_θ(s, a) with few parameters. For years that meant linear models on handcrafted features; in **2013 DeepMind** showed a **deep Q-network (DQN)** works far better with no feature engineering.

**Target Q-value** (Bellman again):

$$y(s,a) = r + \gamma \max_{a'} Q_\theta(s', a')$$

Train by minimising MSE (or **Huber loss**, less sensitive to large errors) between Q_θ(s, a) and y. In practice the net takes **only the state** and outputs **one Q-value per action** (one forward pass instead of one per action).

```python
class DQN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(4, 32), nn.ReLU(),
                                 nn.Linear(32, 32), nn.ReLU(), nn.Linear(32, 2))
    def forward(self, state):
        return self.net(state)

def choose_dqn_action(model, obs, epsilon=0.0):
    if torch.rand(()) < epsilon:
        return torch.randint(2, size=()).item()
    return model(torch.as_tensor(obs)).argmax().item()
```

**DQNs don't handle continuous actions** (you'd need to solve an argmax optimisation at every step) — use policy gradients / actor-critics (SAC, PPO) instead.

### Replay buffer

Store every experience **(s, a, r, s′, done, truncated)** in a buffer (a `deque(maxlen= 100_000)` — the oldest experience is dropped automatically) and train on **random mini-batches** from it. **Why:** consecutive experiences are highly correlated; random sampling breaks the correlation and makes the data distribution more stable (closer to i.i.d., which SGD assumes), and each experience is reused many times → sample efficiency. For very large buffers use a circular buffer or DeepMind's **Reverb**.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Deep Q-learning: experiences go into a replay buffer, random mini-batches train an online Q-network against targets from a frozen target network, which is refreshed periodically">
<rect class="sB" x="14" y="30" width="120" height="50" rx="8"/><text class="sT" x="74" y="53" text-anchor="middle">environment</text><text class="sC" x="74" y="69" text-anchor="middle">Atari, CartPole</text>
<line class="sL" x1="134" y1="55" x2="180" y2="55" marker-end="url(#ah)"/><text class="sC" x="157" y="46" text-anchor="middle">(s, a, r, s′)</text>
<rect class="sW" x="184" y="24" width="150" height="62" rx="8"/><text class="sT" x="259" y="46" text-anchor="middle">replay buffer</text><text class="sC" x="259" y="64" text-anchor="middle">last 100,000 steps</text><text class="sC" x="259" y="80" text-anchor="middle">sampled at random</text>
<line class="sL" x1="334" y1="55" x2="380" y2="55" marker-end="url(#ah)"/><text class="sC" x="357" y="46" text-anchor="middle">batch</text>
<rect class="sA" x="384" y="30" width="150" height="50" rx="8"/><text class="sT" x="459" y="53" text-anchor="middle">online Q-net</text><text class="sC" x="459" y="69" text-anchor="middle">Q_θ(s, ·)</text>
<rect class="sV" x="384" y="130" width="150" height="50" rx="8"/><text class="sT" x="459" y="153" text-anchor="middle">target Q-net</text><text class="sC" x="459" y="169" text-anchor="middle">frozen copy</text>
<line class="sLm" x1="459" y1="128" x2="459" y2="84" marker-end="url(#ahm)"/><text class="sC" x="470" y="110">y = r + γ max Q_target(s′)</text>
<line class="sL" x1="534" y1="55" x2="580" y2="55" marker-end="url(#ah)"/><rect class="sR" x="584" y="30" width="122" height="50" rx="8"/><text class="sT" x="645" y="53" text-anchor="middle">loss</text><text class="sC" x="645" y="69" text-anchor="middle">Huber(Q_θ, y)</text>
<path class="sLr" d="M645 80 V100 H459 V84" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="600" y="95" text-anchor="middle">gradient step</text>
<path class="sLg" d="M384 70 H360 V155 H380" fill="none" stroke-dasharray="5 4" marker-end="url(#ahg)"/><text class="sGt" x="354" y="172" text-anchor="end">copy every N steps</text>
<text class="sS" x="360" y="210" text-anchor="middle">random replay breaks correlations between steps; a frozen target stops the net chasing its own moving estimates</text>
</svg><figcaption>The two tricks that made DQN stable: experience replay and a target network.</figcaption></figure>

### The training step

```python
def dqn_training_step(model, optimizer, criterion, replay_buffer, batch_size,
                      discount_factor):
    state, action, reward, next_state, done, truncated = \
        sample_experiences(replay_buffer, batch_size)
    with torch.inference_mode():
        max_next_Q, _ = model(next_state).max(dim=1)
        running = (~(done | truncated)).float()          # 0 if episode ended
        target_Q = reward + running * discount_factor * max_next_Q
    Q_value = model(state).gather(dim=1, index=action.unsqueeze(1))  # Q of chosen action
    loss = criterion(Q_value, target_Q.unsqueeze(1))
    optimizer.zero_grad(); loss.backward(); optimizer.step()
```

Key details:
- **`gather()`** picks the predicted Q-value of the action actually taken.
- Targets are computed under **`torch.inference_mode()`** — no gradient flows through the target.
- If the episode ended, the future term is zeroed. (Purist note: for a **truncated** — time-limit — episode, the state isn't truly terminal, so strictly you should still bootstrap; Géron zeroes both for simplicity. SB3 handles this with `handle_timeout_termination`.)

Training loop: 800 episodes, 30 **warm-up** episodes before training, ε decays linearly from 1.0 to 0.01 over 500 episodes, NAdam lr = 0.03, γ = 0.95.

**Don't plot the loss — plot the reward per episode.** The loss can fall while the agent gets worse (overfitting a small region) or rise while it improves (fixing underestimated Q-values).

Géron's run reached the max reward of **1,000**, but it was **very unstable**: ~200 reward after ~200 episodes, then **catastrophic forgetting** until ~episode 550. Cause: the model **sets its own targets** — "a dog chasing its own tail".

### DQN improvements (know the names and one-line purpose)

| Improvement | Paper | What it fixes |
|---|---|---|
| **Target network** | Mnih et al. 2013/2015 | A frozen copy of the online net computes targets; synced every N steps (10,000 on Atari) → stable targets |
| **Double DQN** | van Hasselt et al. 2015 | max over noisy estimates **overestimates** Q. The online net *selects* the best next action, the target net *evaluates* it |
| **Prioritised Experience Replay (PER)** | Schaul et al. 2015 | Sample surprising experiences (large \|TD error\|) more often: P ∝ p^ζ (ζ = 0.6); correct the bias with importance weights w = (nP)^−β, β annealed 0.4 → 1 |
| **Dueling DQN** | Wang et al. 2015 | Split Q(s,a) = V(s) + A(s,a); subtract the max advantage so the best action has A = 0. Learns state value even when actions don't matter |
| **Rainbow** | Hessel et al. 2017 | Combines 6 improvements (+ n-step returns, distributional RL, noisy nets) → big jump on Atari |

Original Atari DQN recipe: huge replay buffer, tiny learning rate, **50 million** steps, ε decayed over 1 million steps, a CNN on stacked frames.

**Soft target update (Polyak averaging)** — common today instead of hard copies: θ_target ← τ·θ_online + (1 − τ)·θ_target, τ ≈ 0.005.

---

## 24.9 Actor-critic methods 🔴

> [!info] 📖 Géron Ch. 19 · “Actor-Critic Algorithms” · pp. 773–778

**Actor** = policy network (like REINFORCE). **Critic** = value network estimating V(s). The actor updates using the critic's judgement instead of noisy full returns — "an athlete learning with a coach". Gets the best of both worlds: stochastic policies, continuous actions, **lower variance**, and better data efficiency.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Actor-critic: a shared network body feeds an actor head that outputs the policy and a critic head that estimates state value; the TD error acts as the advantage that updates the actor">
<rect class="sB" x="14" y="80" width="110" height="50" rx="8"/><text class="sT" x="69" y="110" text-anchor="middle">state s</text><line class="sL" x1="124" y1="105" x2="166" y2="105" marker-end="url(#ah)"/>
<rect class="sV" x="170" y="70" width="140" height="70" rx="8"/><text class="sT" x="240" y="103" text-anchor="middle">shared body</text><text class="sC" x="240" y="119" text-anchor="middle">layers</text>
<line class="sL" x1="310" y1="90" x2="366" y2="56" marker-end="url(#ah)"/><rect class="sA" x="370" y="30" width="150" height="50" rx="8"/><text class="sT" x="445" y="53" text-anchor="middle">actor head</text><text class="sC" x="445" y="69" text-anchor="middle">policy π(a | s)</text>
<line class="sL" x1="310" y1="120" x2="366" y2="154" marker-end="url(#ah)"/><rect class="sG" x="370" y="130" width="150" height="50" rx="8"/><text class="sT" x="445" y="153" text-anchor="middle">critic head</text><text class="sC" x="445" y="169" text-anchor="middle">value V(s)</text>
<line class="sLw" x1="520" y1="155" x2="566" y2="120" marker-end="url(#ahw)"/><rect class="sW" x="570" y="90" width="136" height="50" rx="8"/><text class="sT" x="638" y="113" text-anchor="middle">TD error δ</text><text class="sC" x="638" y="129" text-anchor="middle">r + γV(s′) − V(s)</text>
<path class="sLw" d="M638 90 V55 H524" fill="none" stroke-dasharray="5 4" marker-end="url(#ahw)"/><text class="sWt" x="706" y="20" text-anchor="end">advantage: was the action better than expected?</text>
<text class="sS" x="360" y="210" text-anchor="middle">the actor chooses; the critic judges each choice against its expectation (less noisy than full returns)</text>
</svg><figcaption>Actor-critic in one picture. PPO, the algorithm behind most modern RL including RLHF, is an actor-critic with a clipped update.</figcaption></figure>

```python
class ActorCritic(nn.Module):
    def __init__(self):
        super().__init__()
        self.body = nn.Sequential(nn.Linear(4, 32), nn.ReLU(),
                                  nn.Linear(32, 32), nn.ReLU())   # shared layers
        self.actor_head = nn.Linear(32, 1)     # action logit
        self.critic_head = nn.Linear(32, 1)    # state value V(s)
    def forward(self, state):
        f = self.body(state)
        return self.actor_head(f), self.critic_head(f)

def ac_training_step(optimizer, criterion, state_value, target_value, log_prob,
                     critic_weight):
    td_error = target_value - state_value                 # advantage estimate
    actor_loss = -log_prob * td_error.detach()            # don't push critic via actor
    critic_loss = criterion(state_value, target_value)    # V(s) → r + γV(s')
    loss = actor_loss + critic_weight * critic_loss
    optimizer.zero_grad(); loss.backward(); optimizer.step()
```

- The target y = r + γV(s′) is computed in inference mode (y = r if the episode ended).
- The **TD error** replaces REINFORCE's standardised return: encourage actions that did **better than the critic expected**.
- Weight the critic loss lower (critic_weight = 0.3) for stability. Sharing the body saves parameters but couples actor and critic (another tail-chasing risk).
- Trains **every step** (online), 400 episodes, NAdam lr = 1.1e-3 → reaches max reward, but still sensitive to seeds/hyperparameters.

### Stabilised actor-critics

| Algorithm | Year / by | Key idea |
|---|---|---|
| **A3C** | DeepMind 2016 | Many agents explore copies of the environment in parallel and **asynchronously** push updates to a master network; critic estimates the **advantage** |
| **A2C** | OpenAI | Synchronous A3C → bigger batches, better GPU use |
| **TRPO** | Schulman et al. 2015 | Constrain each policy update to a "trust region" (KL limit) |
| **PPO** | Schulman et al. 2017 (OpenAI) | A2C + **clipped objective** so the policy can't change too much per update. Simple, robust — **the default choice**. OpenAI Five (Dota 2) and **RLHF for ChatGPT** used PPO |
| **SAC** | Haarnoja et al. 2018 (Berkeley) | Off-policy, maximises reward **+ entropy** (stay as random as possible while succeeding) → great exploration and **sample efficiency** on continuous control |
| **TD3** | Fujimoto et al. 2018 | Double-critic fix for DDPG overestimation (continuous actions) |

**PPO's clipped objective** (worth writing on a whiteboard):

$$L^{CLIP} = \mathbb{E}\Big[\min\big(\rho_t A_t,\ \text{clip}(\rho_t, 1-\epsilon, 1+\epsilon)\,A_t\big)\Big],\quad \rho_t = \frac{\pi_\theta(a_t|s_t)}{\pi_{\text{old}}(a_t|s_t)}$$

If the new policy makes an action much more (or less) likely than the old one, the gain is capped → no destructive giant updates. PPO also adds a value loss (`vf_coef`) and an **entropy bonus** (`ent_coef`) for exploration. Advantages are usually computed with **GAE** (Generalised Advantage Estimation, λ ≈ 0.95), which blends n-step returns to trade bias against variance.

**Which algorithm? (Géron)** PPO = great general-purpose default. SAC = most sample- efficient for **continuous** actions (robotics). DQN (and variants) = strong for **discrete** tasks (Atari, board games).

---

## 24.10 Mastering Atari Breakout with Stable-Baselines3 PPO 🔴

> [!info] 📖 Géron Ch. 19 · “Mastering Atari Breakout Using the SB3 PPO Implementation” · pp. 778–782

Don't hand-roll production RL — use a tested library. **Stable-Baselines3 (SB3)** provides reliable PyTorch implementations of PPO, A2C, DQN, SAC, TD3.

```python
import ale_py
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_atari_env
from stable_baselines3.common.vec_env import VecFrameStack
from stable_baselines3.common.callbacks import CheckpointCallback

ale = ale_py.ALEInterface()                                   # Atari emulator
envs = make_atari_env("BreakoutNoFrameskip-v4", n_envs=4)     # 4 parallel envs,
envs_stacked = VecFrameStack(envs, n_stack=4)                 # 84×84 gray, 4 frames

ppo_model = PPO("CnnPolicy", envs_stacked, device=device,
                learning_rate=2.5e-4, batch_size=256, n_steps=256, n_epochs=4,
                clip_range=0.1, vf_coef=0.5, ent_coef=0.01, gamma=0.99,
                tensorboard_log="my_ppo_breakout_tensorboard")

cb = CheckpointCallback(save_freq=100_000, save_path="my_ppo_breakout.ckpt")
ppo_model.learn(total_timesteps=30_000_000, progress_bar=True, callback=cb)
ppo_model.save("my_ppo_breakout")
```

- **Preprocessing:** 210×160 RGB → 84×84 grayscale. **Frame stacking** (4 frames as 4 channels) instead of frame skipping, so the agent can see motion (ball direction/speed). Hence `NoFrameskip` ("v4" is just a version number).
- **Hyperparameters:** `n_steps` = env steps per env before each update; `n_epochs` = passes over each rollout; `clip_range` = PPO's ε; `vf_coef` = critic weight; `ent_coef` = exploration bonus.
- **Tuning tips (Géron):** too slow → more parallel envs, then higher lr or clip range; unstable → lower lr/clip range, bigger rollouts or batches. γ ≈ 0.95 for short horizons, 0.995–0.999 for long ones. Raise `ent_coef` to explore more.
- **Checkpoint** long runs (`save_freq` counts `step()` calls — with 4 envs, 50,000 calls = 200,000 timesteps).
- Monitor **`rollout/ep_rew_mean`** in TensorBoard: ≈ 20 after 1M steps, **human level around 10M**, **superhuman around 50M**. The trained agent discovers the classic "dig a tunnel on the side" strategy.

Evaluate deterministically: `action, _ = ppo_model.predict(obs, deterministic=True)`.

---

## 24.11 The wider RL landscape 🔴

> [!info] 📖 Géron Ch. 19 · “Overview of Some Popular RL Algorithms” · pp. 782–785

**Model-free vs model-based:**
- **Model-free** (PG, DQN, actor-critic): learn a policy and/or value, but no model of the environment.
- **Model-based**: have (or learn) a model of transitions and rewards, and **plan** with it. **AlphaGo** — Monte Carlo Tree Search (MCTS, Metropolis & Ulam 1949) guided by a policy network trained with policy gradients; **AlphaGo Zero** — a single network, pure self-play; **AlphaZero** — generalises to chess and shogi; **MuZero** — learns the model itself (doesn't know the rules). Also **Dreamer** (V1–V3; DreamerV3 collected diamonds in Minecraft from scratch in 2023) learns a world model and trains in imagination.

**Curiosity-driven exploration (Pathak et al. 2017):** with sparse rewards, reward the agent intrinsically for **surprise** (prediction error of its own forward model). It learns to play many games without any game reward — losing is "boring" because the game restarts. It gets bored of unpredictable-but-uncontrollable noise too.

**Open-ended learning (OEL):** Uber AI's **POET** (2019) co-evolves environments and agents — **curriculum learning** that gets gradually harder, with agents transferred across environments. Also Enhanced POET (2020) and DeepMind's XLand (2021).

**Other names worth recognising:**
- **Offline RL** (CQL, IQL, Decision Transformer): learn from logged data only — no live exploration. Very relevant to businesses that can't experiment freely on customers.
- **Imitation learning / behaviour cloning:** supervised learning on expert actions.
- **Inverse RL:** infer the reward from expert behaviour.
- **Multi-agent RL:** many interacting agents (traffic, markets, networks).
- **Sim-to-real:** train in simulation with domain randomisation, deploy on robots.

---

## 24.12 🔭 State of the art (2025–26) 🟡 ⭐

![Simulated offer test: bandits lose far fewer acceptances than a fixed equal split.](figures/fig24_bandit_regret.png)
*Simulated offer test: bandits lose far fewer acceptances than a fixed equal split.*

> [!quote] 💬 Say it in the interview
> “For offers I'd start with a contextual bandit (Thompson sampling), which shifts traffic toward winners while learning — lower regret than a fixed A/B split, but weaker inference.”

### RL for LLMs — the biggest RL application today

| Method | How it works | Where you see it |
|---|---|---|
| **RLHF** (Christiano 2017; InstructGPT 2022) | Humans rank answers → train a **reward model** → optimise the LLM with **PPO**, plus a **KL penalty** to the SFT model so it doesn't drift or "reward-hack" | ChatGPT, early Claude and Gemini |
| **RLAIF / Constitutional AI** (Anthropic 2022) | AI feedback guided by written principles replaces much of the human labelling | Claude |
| **DPO** (Rafailov et al. 2023) | Skips the reward model and RL loop: a classification-style loss directly on preference pairs (see Part 21) | Most open models (Zephyr, Llama tuning, Tülu) |
| **GRPO** (DeepSeekMath 2024 → **DeepSeek-R1**, Jan 2025) | PPO **without a critic**: sample a *group* of answers per prompt, advantage = (reward − group mean)/group std | Reasoning models; R1 showed long chain-of-thought *emerges* from RL |
| **RLVR** — RL with verifiable rewards | Reward = the maths answer is correct / the code passes tests / the output format is valid; no reward model to hack | o1/o3, R1, Qwen3, Claude reasoning, coding agents |
| **Agentic RL** | Multi-turn RL over tool calls, browsers, code sandboxes | Coding agents, deep-research agents |

**Interview-ready framing:** "Pretraining gives knowledge, SFT gives format, preference optimisation (RLHF/DPO) gives helpfulness and safety, and RL on verifiable rewards gives reasoning. RL's classic problems all reappear: **reward hacking** (the model games the reward model), **exploration**, **KL regularisation** as a trust region, and **credit assignment** over long reasoning chains."

Libraries: Hugging Face **TRL** (`PPOTrainer`, `DPOTrainer`, `GRPOTrainer`), **OpenRLHF**, **veRL**, **Unsloth** (cheap GRPO on one GPU).

### Other frontiers
- **Robotics foundation models:** vision-language-action models (Google **RT-2**, Physical Intelligence **π0**, NVIDIA **GR00T**), trained on demonstrations then refined with RL; massive GPU simulation (**Isaac Lab**, **MuJoCo MJX**, **Genesis**).
- **World models:** DeepMind **Genie 2/3** (playable 3D worlds from a prompt), DreamerV3.
- **Science & systems:** AlphaDev (sorting), **AlphaTensor** (matrix multiplication), **AlphaChip** (chip floorplanning used for TPUs), **AlphaProof** (IMO silver 2024; Gemini Deep Think reached gold-medal level in 2025), **AlphaEvolve** (2025, LLM-guided evolutionary search found better algorithms and saved ~0.7% of Google's global compute).
- **Data-centre cooling:** DeepMind's RL controllers cut Google data-centre cooling energy by up to ~40% (2016) — the same pattern as telecom energy saving.

### Contextual bandits — the practical "RL-lite" for business

A **multi-armed bandit** is RL with a **single step**: choose an arm (offer), get a reward, no state transitions. A **contextual bandit** uses features (the customer) to choose. Most "RL in production" at telcos, banks and e-commerce is actually bandits.

| Strategy | Idea |
|---|---|
| ε-greedy | Random offer ε% of the time |
| **UCB** | Pick the arm with the highest *upper confidence bound*: mean + c·√(ln t / n) — optimism under uncertainty |
| **Thompson sampling** | Keep a posterior per arm (Beta(successes+1, failures+1)); sample one value per arm, pick the max. Simple, strong, Bayesian |
| **LinUCB / neural bandits** | Contextual versions using customer features |

```python
import numpy as np
rng = np.random.default_rng(42)
true_rates = [0.04, 0.05, 0.07]          # hidden acceptance rates of 3 bundles
wins = np.zeros(3); losses = np.zeros(3)
for t in range(20_000):
    samples = rng.beta(wins + 1, losses + 1)  # Thompson sampling
    arm = samples.argmax()
    reward = rng.random() < true_rates[arm]
    wins[arm] += reward; losses[arm] += 1 - reward
print((wins + losses).astype(int))       # most traffic flows to the 7% bundle
```

**Bandits vs A/B testing (Part 15):** an A/B test splits traffic evenly to *learn* which is best (clean inference, fixed horizon). A bandit shifts traffic toward the winner **while learning** → less **regret** (lost revenue during the experiment), but weaker statistical inference. Use A/B for decisions you must defend; bandits for ongoing optimisation of many variants (creatives, offers, push-notification timing).

**Off-policy evaluation (OPE):** before deploying a new offer policy, estimate its value on historical logs with **Inverse Propensity Scoring (IPS)** or **Doubly Robust** estimators — which requires logging the **probability** with which each action was chosen. Tell an interviewer this; it shows production maturity. Tools: Vowpal Wabbit, Open Bandit Pipeline, Azure Personalizer (retired) → now built in-house on VW or bandit libraries.

---

## 24.13 Real-world examples 🟡

1. **Telecom next-best-offer (bandit):** each day the e& app shows one of 8 data/bundle offers per user. Context = tenure, ARPU, data usage trend, device, recharge pattern. Reward = acceptance (or margin, net of cannibalisation). A contextual Thompson-sampling or LinUCB policy learns per segment; 5–10% of traffic stays random to keep logging clean propensities for OPE. Guardrails: frequency caps, fairness, no offers to customers in collections.
2. **RAN energy saving:** cells can switch carriers or enter sleep mode at low traffic. State = load, time, neighbour load; actions = sleep/wake/carrier shutdown; reward = energy saved − penalty for dropped calls/throughput loss. Vendors (Ericsson, Nokia, Huawei) ship ML/RL-based energy features; operators report double-digit % energy savings on the RAN, which is the largest share of a mobile network's power bill. Deployment is typically as **O-RAN rApps/xApps** in a RAN Intelligent Controller, trained in a **digital twin** first.
3. **Retention journeys:** a churn model (Part 8) says *who* is at risk; RL/bandits decide *what to do and when* (call vs SMS vs discount level), optimising long-run CLV instead of one-shot conversion — with offline RL on historical campaign logs because you can't freely experiment on high-value customers.
4. **Dynamic pricing & ride-hailing:** Uber/DiDi use RL for driver dispatch and repositioning (DiDi reported ~0.5–5% gains in driver income across cities with RL-based dispatching).
5. **Recommendation:** YouTube's REINFORCE-based recommender (Chen et al. 2019, "Top-K Off-Policy Correction") — described as one of the largest launches in years for YouTube. Netflix and Spotify use bandits for artwork and home-page personalisation.
6. **LLMs:** DeepSeek-R1 (2025) matched o1-level maths/coding reasoning using GRPO on verifiable rewards; its open weights triggered the wave of open reasoning models.

---

> [!check] ✅ Key takeaways
> - RL learns a policy from rewards through interaction; feedback is delayed and actions change the data.
> - The discount factor γ sets the horizon, and changing it can change the optimal policy.
> - Q-learning learns action values off-policy; DQN adds replay buffers and target networks for stability.
> - Actor-critic methods (A2C, PPO, SAC) combine a policy and a value function; PPO is the general default.
> - For business offers, contextual bandits beat fixed A/B splits on regret; RLHF/GRPO power modern LLMs.

## 24.14 Interview drill — reinforcement learning (Géron Ch. 19 exercises, answered) 🟡

> [!info] 📖 Géron Ch. 19 · Exercises · p. 785

**1. Define RL. How is it different from supervised/unsupervised learning?** An agent learns, by trial and error, a policy that maximises expected cumulative reward from interacting with an environment. Unlike supervised learning there are no labels — only rewards, often **delayed and sparse**; the agent's actions **affect the data** it collects; it must balance **exploration and exploitation**. Unlike unsupervised learning there is an explicit objective (the reward).

**2. Three applications not in the chapter.**
- *Offer personalisation:* env = customers + app; agent = offer policy; actions = which offer/channel/time; reward = acceptance or margin.
- *Network energy saving:* env = radio network; agent = cell controller; actions = sleep/wake carriers; reward = energy saved minus QoS penalties.
- *Inventory / supply chain:* env = warehouse + demand; actions = order quantities; reward = −(holding + stock-out costs). (Others: HVAC control, traffic lights, ad bidding, portfolio rebalancing, LLM alignment.)

**3. What is the discount factor? Can changing it change the optimal policy?** γ ∈ [0, 1) weights future rewards by γᵏ; it defines how far-sighted the agent is (and keeps infinite sums finite). **Yes** — in Géron's MDP, γ = 0.90 → stay put in s1; γ = 0.95 → go through the fire.

**4. How do you measure an RL agent's performance?** Mean (and variance) of **total reward per episode** over many evaluation episodes, with deterministic actions and different seeds. Also sample efficiency (reward vs environment steps), wall-clock time, and business KPIs. Not the training loss.

**5. What is the credit-assignment problem? How to alleviate it?** When a reward arrives, it's unclear which past actions caused it; it occurs whenever rewards are delayed. Alleviate with **discounted returns**, advantage estimates (critic, GAE), **reward shaping** (intermediate rewards — carefully, to avoid reward hacking), and shorter horizons.

**6. What's the point of a replay buffer?** Break the correlation between consecutive experiences (more i.i.d. batches → stable SGD), reuse each experience many times (sample efficiency), and avoid forgetting old situations. Only usable by **off-policy** algorithms.

**7. What is an off-policy algorithm? Benefits?** It learns a target policy different from the behaviour policy generating the data (Q-learning, DQN, SAC). Benefits: learn from old data, other agents, human demos, or logs; use replay buffers; explore freely while learning the greedy policy.

**8. What is a model-based algorithm? Examples.** It uses a model of the environment's transitions/rewards (given or learned) to plan or generate imagined experience: value/Q-value iteration on a known MDP, **AlphaGo/AlphaZero** (MCTS with known rules), **MuZero** and **Dreamer** (learned models).

**9–10. LunarLander / BipedalWalker.** Start with SB3: `PPO("MlpPolicy", "LunarLander-v3")` for ~1M steps (solved at mean reward ≥ 200); **SAC or TD3** for BipedalWalker (continuous actions, ≥ 300 to solve). (Gymnasium ≥ 1.0 renamed LunarLander-v2 → **v3**.)

**Extra questions interviewers ask:**
- **"Explain Q-learning in one line."** Learn Q(s,a) by moving it toward r + γ·max Q(s′,a′) using observed transitions; act greedily w.r.t. Q.
- **"Why is DQN unstable and how is it fixed?"** Moving, self-generated targets + correlated data + overestimation → target network, replay buffer, Double DQN, Huber loss, gradient clipping.
- **"Value-based vs policy-based?"** Value-based learns Q and acts greedily (discrete actions, off-policy, sample-efficient). Policy-based optimises the policy directly (continuous and stochastic policies, on-policy, higher variance). Actor-critic combines them.
- **"What does PPO clip and why?"** The probability ratio new/old policy, to ±ε (0.1–0.2), so each update stays in a trust region.
- **"How does RLHF work and what's reward hacking?"** Reward model from human rankings → PPO with KL penalty. Reward hacking = exploiting reward-model flaws (verbosity, sycophancy) rather than truly improving.
- **"Bandit vs full RL?"** A bandit has no state transitions — actions don't affect future states. If today's offer changes tomorrow's customer state (fatigue, churn), you need RL or at least bandits with guardrails.
- **"When would you *not* use RL?"** When you can't simulate or safely explore, rewards are poorly defined, or a supervised model + business rules suffices (most of the time). Say this — it shows judgement.

---

## Further reading and sources

**Book:** Géron Ch. 19 + notebook (exercise solutions at homl.info/colab-p).

**Textbooks & courses:** Sutton & Barto, *Reinforcement Learning: An Introduction* (2nd ed., free online — the bible) · David Silver's UCL RL course (YouTube) · **Hugging Face Deep RL Course** (free, hands-on with SB3) · OpenAI **Spinning Up in Deep RL** (clear algorithm write-ups) · Phil Winder, *Reinforcement Learning* (O'Reilly) · Lattimore & Szepesvári, *Bandit Algorithms* (free PDF) · Nathan Lambert, *RLHF Book* (free online).

**Papers:** Williams (1992) REINFORCE · Watkins (1989) Q-learning · Mnih et al. (2013, 2015) DQN · van Hasselt et al. (2015) Double DQN · Schaul et al. (2015) PER · Wang et al. (2015) Dueling · Hessel et al. (2017) Rainbow · Mnih et al. (2016) A3C · Schulman et al. (2015) TRPO, (2015) GAE, (2017) **PPO** · Haarnoja et al. (2018) SAC · Silver et al. (2016, 2017) AlphaGo/AlphaGo Zero/AlphaZero · Schrittwieser et al. (2019) MuZero · Pathak et al. (2017) curiosity · Wang et al. (2019) POET · Ouyang et al. (2022) InstructGPT · Bai et al. (2022) Constitutional AI · Rafailov et al. (2023) DPO · Shao et al. (2024) DeepSeekMath (GRPO) · DeepSeek-AI (2025) **DeepSeek-R1** · Chen et al. (2019) YouTube off-policy REINFORCE · Li et al. (2010) LinUCB (Yahoo! news).

**Libraries:** Gymnasium · Stable-Baselines3 (+ RL Zoo for tuned hyperparameters) · CleanRL (single-file readable implementations) · TorchRL · Hugging Face TRL · Vowpal Wabbit (bandits) · Open Bandit Pipeline.

---

<!-- nav -->
> [!example] 🧭 Step 23 of 26 · Stage 6 of 7: Modern AI
> ← [Part 23 · Generative models](23_Generative_Models_Autoencoders_GANs_Diffusion.md) · [Part 25 · SOTA roadmap](25_State_of_the_Art_and_Learning_Roadmap.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
