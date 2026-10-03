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
