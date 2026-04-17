using UnityEngine;
using System.Collections.Generic;

public class ManualPath : MonoBehaviour
{
    [System.Serializable]
    public class WaypointData
    {
        public Transform transform;
        public bool isMagnetic = true;

        [Range(0f, 1f)]
        [Tooltip("How much the camera eases into this specific point. 1 = very weighted/slow.")]
        public float weightedSlow = 0.7f;

        [Tooltip("How fast the camera pulls to this point when you stop scrolling.")]
        public float snapPower = 4f;
    }

    [Header("Waypoints")]
    public List<WaypointData> waypoints = new List<WaypointData>();

    [Header("Global Physics")]
    public float sensitivity = 0.05f;
    public float smoothTime = 0.35f;

    [Header("Auto-Snap Settings")]
    public float snapDelay = 0.4f;

    private float targetProgress = 0f;
    private float currentProgress = 0f;
    private float velocity = 0f;
    private float scrollIdleTimer = 0f;

    void Update()
    {
        float scroll = Input.mouseScrollDelta.y;

        if (Mathf.Abs(scroll) > 0.01f)
        {
            scrollIdleTimer = 0f;
            targetProgress -= scroll * sensitivity;
        }
        else
        {
            scrollIdleTimer += Time.deltaTime;
            if (scrollIdleTimer >= snapDelay)
            {
                ApplyMagneticSnap();
            }
        }

        targetProgress = Mathf.Clamp01(targetProgress);
        currentProgress = Mathf.SmoothDamp(currentProgress, targetProgress, ref velocity, smoothTime);

        UpdateCameraTransform(currentProgress);
    }

    void ApplyMagneticSnap()
    {
        if (waypoints.Count < 2) return;

        float bestProgress = targetProgress;
        float minDistance = float.MaxValue;
        int closestIndex = -1;

        for (int i = 0; i < waypoints.Count; i++)
        {
            if (!waypoints[i].isMagnetic) continue;

            float pointProgress = (float)i / (waypoints.Count - 1);
            float dist = Mathf.Abs(targetProgress - pointProgress);

            if (dist < minDistance)
            {
                minDistance = dist;
                bestProgress = pointProgress;
                closestIndex = i;
            }
        }

        if (closestIndex != -1)
        {
            float power = waypoints[closestIndex].snapPower;
            targetProgress = Mathf.MoveTowards(targetProgress, bestProgress, Time.deltaTime * power);
        }
    }

    void UpdateCameraTransform(float t)
    {
        if (waypoints.Count < 2) return;

        int segments = waypoints.Count - 1;
        float scaledT = t * segments;
        int index = Mathf.Clamp(Mathf.FloorToInt(scaledT), 0, segments - 1);
        float segmentT = scaledT - index;

        // Blending the "weight" between the current two waypoints
        float weight = Mathf.Lerp(waypoints[index].weightedSlow, waypoints[index + 1].weightedSlow, segmentT);
        float easedT = Mathf.SmoothStep(0, 1, segmentT);
        float finalT = Mathf.Lerp(segmentT, easedT, weight);

        // Apply buttery Position
        transform.position = GetCatmullRomPosition(index, finalT);

        // Apply buttery Rotation
        transform.rotation = GetCubicRotation(index, finalT);
    }

    // --- BUTTERY ROTATION LOGIC ---
    Quaternion GetCubicRotation(int index, float t)
    {
        Quaternion q0 = waypoints[Mathf.Max(index - 1, 0)].transform.rotation;
        Quaternion q1 = waypoints[index].transform.rotation;
        Quaternion q2 = waypoints[index + 1].transform.rotation;
        Quaternion q3 = waypoints[Mathf.Min(index + 2, waypoints.Count - 1)].transform.rotation;

        // Ensure quaternions take the shortest path relative to q1 to avoid sudden flips
        q0 = EnsureShortest(q1, q0);
        q2 = EnsureShortest(q1, q2);
        q3 = EnsureShortest(q1, q3);

        // We calculate spherical tangents to ensure the rotation doesn't "pop" at waypoints
        return Squad(q0, q1, q2, q3, t);
    }

    Quaternion Squad(Quaternion q0, Quaternion q1, Quaternion q2, Quaternion q3, float t)
    {
        Quaternion s1 = GetIntermediate(q0, q1, q2);
        Quaternion s2 = GetIntermediate(q1, q2, q3);

        // Standard Squad blending
        Quaternion a = Quaternion.Slerp(q1, q2, t);
        Quaternion b = Quaternion.Slerp(s1, s2, t);
        return Quaternion.Slerp(a, b, 2f * t * (1f - t));
    }

    Quaternion GetIntermediate(Quaternion q0, Quaternion q1, Quaternion q2)
    {
        // Ensure shortest-path for adjacent quaternions relative to q1
        q0 = EnsureShortest(q1, q0);
        q2 = EnsureShortest(q1, q2);

        Quaternion q1Inv = Quaternion.Inverse(q1);

        // Use proper quaternion logarithm / exponential math
        Quaternion log1 = Log(q1Inv * q2);
        Quaternion log2 = Log(q1Inv * q0);

        // average and scale
        Quaternion sum = new Quaternion(
            (log1.x + log2.x) * -0.25f,
            (log1.y + log2.y) * -0.25f,
            (log1.z + log2.z) * -0.25f,
            0f
        );

        Quaternion exp = Exp(sum);
        Quaternion result = q1 * exp;
        return NormalizeSafe(result);
    }

    // Ensure two quaternions are on the same hemisphere (shortest rotation direction)
    private static Quaternion EnsureShortest(Quaternion reference, Quaternion q)
    {
        if (Quaternion.Dot(reference, q) < 0f)
            return new Quaternion(-q.x, -q.y, -q.z, -q.w);
        return q;
    }

    private static Quaternion NormalizeSafe(Quaternion q)
    {
        float mag = Mathf.Sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
        if (mag > 1e-6f)
        {
            return new Quaternion(q.x / mag, q.y / mag, q.z / mag, q.w / mag);
        }
        return Quaternion.identity;
    }

    // Quaternion logarithm (returns vector part in x,y,z and 0 in w)
    Quaternion Log(Quaternion q)
    {
        // Clamp w to avoid NaNs
        float qw = Mathf.Clamp(q.w, -1f, 1f);
        float vMag = Mathf.Sqrt(q.x * q.x + q.y * q.y + q.z * q.z);

        if (vMag < 1e-6f)
        {
            return new Quaternion(0f, 0f, 0f, 0f);
        }

        float angle = Mathf.Acos(qw);
        float coeff = angle / vMag;
        return new Quaternion(q.x * coeff, q.y * coeff, q.z * coeff, 0f);
    }

    // Quaternion exponential (expects a quaternion with w == 0, where x,y,z are axis*angle)
    Quaternion Exp(Quaternion q)
    {
        float angle = Mathf.Sqrt(q.x * q.x + q.y * q.y + q.z * q.z);
        if (angle < 1e-6f)
        {
            // small angle: sin(angle)/angle ~ 1
            return new Quaternion(q.x, q.y, q.z, Mathf.Cos(angle));
        }

        float s = Mathf.Sin(angle) / angle;
        return new Quaternion(q.x * s, q.y * s, q.z * s, Mathf.Cos(angle));
    }

    // --- BUTTERY POSITION LOGIC ---
    Vector3 GetCatmullRomPosition(int index, float t)
    {
        Vector3 p0 = waypoints[Mathf.Max(index - 1, 0)].transform.position;
        Vector3 p1 = waypoints[index].transform.position;
        Vector3 p2 = waypoints[index + 1].transform.position;
        Vector3 p3 = waypoints[Mathf.Min(index + 2, waypoints.Count - 1)].transform.position;

        return 0.5f * (
            (2f * p1) + (-p0 + p2) * t +
            (2f * p0 - 5f * p1 + 4f * p2 - p3) * t * t +
            (-p0 + 3f * p1 - 3f * p2 + p3) * t * t * t
        );
    }

    // --- GIZMO VISUALIZATION ---
    private void OnDrawGizmos()
    {
        if (waypoints == null || waypoints.Count < 2) return;

        Gizmos.color = Color.cyan;
        Vector3 lastPos = waypoints[0].transform.position;

        // Draw the curved path
        int resolution = waypoints.Count * 10;
        for (int i = 1; i <= resolution; i++)
        {
            float t = (float)i / resolution;
            int segments = waypoints.Count - 1;
            float scaledT = t * segments;
            int idx = Mathf.Clamp(Mathf.FloorToInt(scaledT), 0, segments - 1);
            float segT = scaledT - idx;

            Vector3 newPos = GetCatmullRomPosition(idx, segT);
            Gizmos.DrawLine(lastPos, newPos);
            lastPos = newPos;
        }

        // Draw markers for magnetic points
        foreach (var wp in waypoints)
        {
            if (wp.transform == null) continue;
            Gizmos.color = wp.isMagnetic ? Color.green : Color.red;
            Gizmos.DrawWireSphere(wp.transform.position, 0.2f);
        }
    }
}
